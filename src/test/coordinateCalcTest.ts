'use strict';

const mocha = require('mocha');
let assert = require('power-assert');
let coordinateCalc = require('../../temp/browser/coordinate-calc').coordinateCalc;

describe(
  'Coordinate Calc Test',
  function () {
    let testCoordinate = {
      lat : 40.0,
      lon : 140.0,
    }
    it(
      'Positive lat and positive lng',
      function () {
        let area = coordinateCalc.getCoordinateArea(testCoordinate, 10);
        assert.deepEqual(true, area.n > area.s && area.e > area.w);
      }
    );
    testCoordinate = {
      lat : -40.0,
      lon : 140.0,
    }
    it(
      'Negative lat and positive lng',
      function () {
        let area = coordinateCalc.getCoordinateArea(testCoordinate, 10);
        assert.deepEqual(true, area.n > area.s && area.e > area.w);
      }
    );
    testCoordinate = {
      lat : 40.0,
      lon : -140.0,
    }
    it(
      'Positive lat and negative lng',
      function () {
        let area = coordinateCalc.getCoordinateArea(testCoordinate, 10);
        assert.deepEqual(true, area.n > area.s && area.e > area.w);
      }
    );
    testCoordinate = {
      lat : -40.0,
      lon : -140.0,
    }
    it(
      'Negative lat and negative lng',
      function () {
        let area = coordinateCalc.getCoordinateArea(testCoordinate, 10);
        assert.deepEqual(true, area.n > area.s && area.e > area.w);
      }
    );
    testCoordinate = {
      lat : 40.0,
      lon : -180.0,
    }
    it(
      'West edge lng',
      function () {
        let area = coordinateCalc.getCoordinateArea(testCoordinate, 10);
        assert.deepEqual(true, area.n > area.s && area.e > area.w && area.w > 0);
      }
    );

    testCoordinate = {
      lat : 40.0,
      lon : 180.0,
    }
    it(
      'East edge lng',
      function () {
        let area = coordinateCalc.getCoordinateArea(testCoordinate, 10);
        assert.deepEqual(true, area.n > area.s && area.e > area.w && area.w > 0);
      }
    );
  }
)

