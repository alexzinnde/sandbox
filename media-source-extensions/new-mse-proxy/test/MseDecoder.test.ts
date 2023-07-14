/**
 * @jest-environment jsdom
 */

import {describe, it, expect, beforeEach, jest} from '@jest/globals';
import {MseDecoder} from '../src/modules/MseDecoder';

describe('MseDecoder Module', () => {
  let mseDecoder: MseDecoder;

  beforeEach(() => {
    Object.defineProperty(window, 'MediaSource', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        // MediaSource implementation goes here
        addEventListener: jest.fn()
      }))
    });
    Object.defineProperty(window, 'URL', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        // MediaSource implementation goes here
        createObjectURL: jest.fn()
      }))
    });
    const videoElement = document.createElement('video');
    mseDecoder = new MseDecoder(videoElement);
  });
  it('Should have a public member state', () => {
    expect(mseDecoder.status).toBeDefined();
    expect(mseDecoder.status.value).toBe('initialize');
  });
});
