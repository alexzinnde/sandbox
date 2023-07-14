type SegmentWithStatusPromise = {
  data: ArrayBuffer;
  resolveStatusPromise: (status: WriteStatus) => void;
};

export default SegmentWithStatusPromise;