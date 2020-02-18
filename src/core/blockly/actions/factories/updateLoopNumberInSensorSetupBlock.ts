import { BlockEvent } from '../../state/event.data';
import { UpdateSetupSensorBlockLoop, ActionType } from '../actions';
import { BlockType } from '../../state/block.data';

export const updateLoopNumberInSensorSetupBlock = (
  event: BlockEvent
): UpdateSetupSensorBlockLoop[] => {
  const { blocks, newValue, fieldName, blockId } = event;

  const block = blocks.find((block) => block.id === blockId);

  // Only want to update the sensor setup blocks if the arduino loop block changed
  if (block.blockName !== 'arduino_loop') {
    return [];
  }

  // Only want to update if the loop field changed and there is a newValue for it
  if (fieldName !== 'LOOP_TIMES' && !newValue) {
    return [];
  }

  const newLoopNumber = +newValue;

  return blocks
    .filter((block) => block.type === BlockType.SENSOR_SETUP)
    .filter(
      (block) =>
      // Only update the blocks where the current loop value is greater than the one in the block. 
      // This is because what is in the block right now is still valid
        +block.fieldValues.find((field) => field.name === 'LOOP').value >
        newLoopNumber
    )
    .map((block) => {
      return {
        blockId: block.id,
        loop: newLoopNumber,
        type: ActionType.SETUP_SENSOR_BLOCK_LOOP_FIELD_UPDATE
      };
    });
};
