import { Subject } from "../../src/rx";

export type SegmentsConfigType = {
  baseUrl: string;
  initSegmentUrl?: string;
  templateUri: string;
  segmentStartId: number;
  segmentEndId: number;
};

export default class Segments {
  public segments: ArrayBuffer[];
  public segmentStartId: number;
  public segmentEndId: number;
  public currentSegmentId: number;
  public isLoaded: Subject<boolean>;

  constructor({baseUrl, initSegmentUrl, templateUri, segmentStartId, segmentEndId}: SegmentsConfigType) {
    this.segments = [];
    this.segmentStartId = segmentStartId;
    this.segmentEndId = segmentEndId;
    this.currentSegmentId = 0;
    this.isLoaded = new Subject(false);

    this._fetchAllSegments(baseUrl, templateUri, segmentStartId, segmentEndId, initSegmentUrl)
      .then(() => (this.isLoaded.value = true))
      .catch((e: unknown) => console.error('[Segments] Error fetching all segments at [%s]\n[%o]', baseUrl, e));
  }

  public getNextSegment(): ArrayBuffer {
    const segment = this.segments[this.currentSegmentId];

    this.currentSegmentId += 1;

    if (this.currentSegmentId === this.segmentEndId) {
      this.currentSegmentId = this.segmentStartId;
    }

    return segment;
  }

  public setCurrentSegmentId(id: number): void {
    this.currentSegmentId = id;
  }

  private async _fetchAllSegments(
    baseUrl: string,
    templateUri: string,
    segmentStartId: number,
    segmentEndId: number,
    initSegmentUrl?: string
  ) {
    if (initSegmentUrl) {
      this.segments.push(await this._fetchSegmentAt(`${baseUrl}/${initSegmentUrl}`));
    }

    for (let segmentId = segmentStartId; segmentId <= segmentEndId; segmentId += 1) {
      this.segments.push(await this._fetchSegmentAt(`${baseUrl}/${templateUri.replace('$Number%', segmentId.toString())}`));
    }
  }

  private async _fetchSegmentAt(url: string) {
    const res = await fetch(url);

    return res.arrayBuffer();
  }
}

function arrayRange(start: number, end: number): number[] {
  if (start === end) {
    return [end];
  }

  return [start].concat(arrayRange(start + 1, end));
}
