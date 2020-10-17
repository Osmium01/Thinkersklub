import type { BlockEvent } from "../blockly/dto/event.type";
import {
  ArduinoFrame,
  Timeline,
  ArduinoComponentState,
  SENSOR_COMPONENTS,
  ArduinoFrameContainer,
} from "./arduino.frame";
import { BlockType, BlockData } from "../blockly/dto/block.type";
import { generateFrame } from "./transformer/block-to-frame.transformer";
import _ from "lodash";
import {
  getLoopTimeFromBlockData,
  findArduinoLoopBlock,
  findArduinoSetupBlock,
} from "../blockly/helpers/block-data.helper";
import {
  sensorSetupBlockName,
  convertToState,
} from "../blockly/transformers/sensor-data.transformer";
import { generateInputFrame } from "./transformer/block-to-frame.transformer";
import type {  Settings } from "../../stores/settings.store";
import { defaultSetting } from '../../stores/settings.store';

export const eventToFrameFactory = (
  event: BlockEvent,
  settings: Settings = defaultSetting): ArduinoFrameContainer => {
  const { blocks } = event;

  const preSetupBlockType = [
    BlockType.SENSOR_SETUP,
    BlockType.SETUP,
    BlockType.LIST_CREATE,
  ];

  const preSetupBlocks = blocks.filter((b) =>
    preSetupBlockType.includes(b.type)
  );

  const frames: ArduinoFrame[] = preSetupBlocks.reduce((prevFrames, block) => {
    const previousState =
      prevFrames.length === 0
        ? undefined
        : _.cloneDeep(prevFrames[prevFrames.length - 1]);

    return [
      ...prevFrames,
      ...generateFrame(
        blocks,
        block,
        event.variables,
        { iteration: 0, function: "pre-setup" },
        previousState
      ),
    ];
  }, []);

  const arduinoSetupBlock = findArduinoSetupBlock(blocks);

  const previousFrame = _.isEmpty(frames)
    ? undefined
    : frames[frames.length - 1];

  const setupFrames = arduinoSetupBlock
    ? generateInputFrame(
        arduinoSetupBlock,
        blocks,
        event.variables,
        { iteration: 0, function: "setup" },
        "setup",
        getPreviousState(
          blocks,
          { iteration: 0, function: "pre-setup" },
          previousFrame
        )
      )
    : [];

  setupFrames.forEach((f) => frames.push(f));

  const arduinoLoopBlock = findArduinoLoopBlock(blocks);
  const loopTimes = getLoopTimeFromBlockData(blocks);
  const framesWithLoop = _.range(1, loopTimes + 1).reduce(
    (prevFrames, loopTime) => {
      const timeLine: Timeline = { iteration: loopTime, function: "loop" };
      const previousFrame = _.isEmpty(prevFrames)
        ? undefined
        : prevFrames[prevFrames.length - 1];

      return [
        ...prevFrames,
        ...generateInputFrame(
          arduinoLoopBlock,
          blocks,
          event.variables,
          timeLine,
          "loop",
          getPreviousState(blocks, timeLine, _.cloneDeep(previousFrame)) // Deep clone to prevent object memory sharing
        ),
      ];
    },
    frames
  );

  return {
    board: event.microController,
    frames: framesWithLoop,
    error: false,
    settings,
  };
};

const getPreviousState = (
  blocks: BlockData[],
  timeline: Timeline,
  previousFrame: ArduinoFrame = undefined
): ArduinoFrame => {
  if (previousFrame === undefined) {
    return undefined;
  }

  const nonSensorComponent = (previousFrame as ArduinoFrame).components.filter(
    (c) => !isSensorComponent(c)
  );
  const sensorSetupBlocks = blocks.filter((b) =>
    sensorSetupBlockName.includes(b.blockName)
  );
  const newComponents = [
    ...nonSensorComponent,
    ...sensorSetupBlocks.map((b) => convertToState(b, timeline)),
  ];
  return { ...previousFrame, components: newComponents };
};

const isSensorComponent = (component: ArduinoComponentState) => {
  {
    return SENSOR_COMPONENTS.includes(component.type);
  }
};
