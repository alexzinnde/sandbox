/**
 * Copyright 2023 Phenix Real Time Solutions, Inc. Confidential and Proprietary. All Rights Reserved.
 */

export async function fetchSegmentAt(url: string) {
  return (await fetch(url)).arrayBuffer();
}

export type SegmentManagerConfig = {
  initSegmentUrl?: string;
  templateUrl: string;
  maxSegmentIndex: number;
};

export default class SegmentManager {
  private _initSegmentUrl?: string;
  private _templateUrl: string;
  private _segments: ArrayBuffer[];
  private _initSegment?: ArrayBuffer;
  private _currentSegmentIndex: number;
  private _maxSegmentIndex: number;
  private _feedInvalidData: boolean;
  private _invalidDataSegment: ArrayBuffer;
  private _truncateSegment: number;

  constructor({initSegmentUrl, templateUrl, maxSegmentIndex}: SegmentManagerConfig) {
    this._templateUrl = templateUrl;
    this._initSegmentUrl = initSegmentUrl;
    this._maxSegmentIndex = maxSegmentIndex;
    this._segments = [];
    this._currentSegmentIndex = 0;
    this._feedInvalidData = false;
    this._invalidDataSegment = new Uint8Array([0xff, 0xff, 0xff]);
    this._truncateSegment = 0;
  }

  get initSegment() {
    return this._initSegment;
  }

  set currentSegmentIndex(value: number) {
    this._currentSegmentIndex = value;
  }

  public async loadAllSegments() {
    if (this._initSegmentUrl) {
      this._initSegment = await fetchSegmentAt(this._initSegmentUrl);
    }

    this._segments = await Promise.all(
      [...Array(this._maxSegmentIndex).keys()].map(async segmentId => fetchSegmentAt(this._templateUrl.replace('%Number$', segmentId.toString())))
    );
  }

  public getSegmentAt(index: number) {
    if (index < 0 || index > this._maxSegmentIndex) {
      throw new Error(`Segment id is outside of range min [0] max [${this._maxSegmentIndex}]`);
    }

    return this._segments[index];
  }

  public getSegmentAndIncrementIndex() {
    const segment = this._segments[this._currentSegmentIndex];

    this._currentSegmentIndex += 1;

    if (this._currentSegmentIndex === this._maxSegmentIndex) {
      this._currentSegmentIndex = 0;
    }

    if (this._feedInvalidData) {
      this._feedInvalidData = false;

      return this._invalidDataSegment;
    }

    if (this._truncateSegment > 0) {
      console.log('[Segment Manager] feeding truncated segment [%s]', this._truncateSegment)
      this._truncateSegment -= 1;

      return segment.slice(0, getRandomInt(20, segment.byteLength));
    }

    return segment;
  }

  public setFeedInvalidData() {
    this._feedInvalidData = true;
  }

  public truncateSegment(num = 1) {
    this._truncateSegment = num;
  }
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
