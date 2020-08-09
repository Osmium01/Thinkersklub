import { CreateComponent, SyncComponent } from '../svg.component';
import { UltraSonicSensorState } from '../../frames/arduino-components.state';
import {
  componentToSvgId,
  findArduinoEl,
  createComponentEl,
} from '../svg-helpers';
import { Element, Svg } from '@svgdotjs/svg.js';

import ultraSonicSvgString from '../svgs/ultrasonic-sensor/ultrasonic-sensor.svg';
import { addDraggableEvent } from '../component-events.helpers';
import { positionComponent } from '../svg-position';
import { createWire, createPowerWire, createGroundWire } from '../wire';

export const createUltraSonicSensor: CreateComponent = (state, frame, draw) => {
  const ultraSonicState = state as UltraSonicSensorState;

  const id = componentToSvgId(ultraSonicState);
  let ultraSonicEl = draw.findOne('#' + id) as Element;
  const arduinoEl = findArduinoEl(draw);

  if (ultraSonicEl) {
    syncDistance(ultraSonicEl, ultraSonicState.cm);
    return;
  }

  ultraSonicEl = createComponentEl(draw, state, ultraSonicSvgString);
  (window as any).ultraSonicEl = ultraSonicEl;
  addDraggableEvent(ultraSonicEl, arduinoEl, draw);
  positionComponent(
    ultraSonicEl,
    arduinoEl,
    draw,
    ultraSonicState.trigPin,
    'PIN_TRIG'
  );
  createWires(ultraSonicEl, ultraSonicState, draw, id, arduinoEl);
  syncDistance(ultraSonicEl, ultraSonicState.cm);
};

export const updateUltraSonicSensor: SyncComponent = (state, frame, draw) => {
  const ultraSonicState = state as UltraSonicSensorState;

  const id = componentToSvgId(ultraSonicState);
  let ultraSonicEl = draw.findOne('#' + id) as Element;
  syncDistance(ultraSonicEl, ultraSonicState.cm);
};

const syncDistance = (componentEl: Element, distance: number) => {
  const firstDistance = 224;
  const distanceTextEl = componentEl.findOne('#DISTANCE_TEXT') as Element;
  const cxTextDistance = distanceTextEl.cx();
  const distanceEl = componentEl.findOne('#DISTANCE') as Element;
  const distanceNumber =
    firstDistance - distance > 100 ? firstDistance - distance : 100;
  distanceEl.y(distanceNumber);
  distanceTextEl.node.innerHTML = `${distance} cm`;
  distanceTextEl.cx(cxTextDistance);
};

const createWires = (
  componentEl: Element,
  state: UltraSonicSensorState,
  draw: Svg,
  id: string,
  arduionEl: Element
) => {
  createPowerWire(
    componentEl,
    state.trigPin,
    arduionEl as Svg,
    draw,
    id,
    'left'
  );
  createWire(
    componentEl,
    state.trigPin,
    'PIN_TRIG',
    arduionEl,
    draw,
    '#177a6c',
    'trig-pin'
  );
  createWire(
    componentEl,
    state.echoPin,
    'PIN_ECHO',
    arduionEl,
    draw,
    '#a03368',
    'echo-pin'
  );
  createGroundWire(
    componentEl,
    state.echoPin,
    arduionEl as Svg,
    draw,
    id,
    'right'
  );
};
