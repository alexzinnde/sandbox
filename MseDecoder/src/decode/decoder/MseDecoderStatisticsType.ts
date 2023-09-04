import TrackWriterStatisticsType from '../../tracks/TrackWriterStatistcsType'

type MseDecoderStatisticsType = {
  allTracks: TrackWriterStatisticsType
  perTrack: Record<string, TrackWriterStatisticsType>
}

export default MseDecoderStatisticsType;
