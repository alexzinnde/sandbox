/**
 WHEN subscribing to NAL unit by type
GIVEN a chunk containing a single frame in H264 Annex B Byte stream format
GIVEN the SDP indicates embedding format is x-phenix-bitstream=embedded-iso-bmff:2023
GIVEN subscriptions to any combination of VCL NAL unit types [1..5]
   GIVEN the presence of VCL NAL units with truncated slice data in the chunk
   GIVEN the VCL NAL unit precedes the VCL NAL unit with non-escaped slice data
   GIVEN subscriptions that match the NAL unit type
   THEN the subscribers are notified with the VCL NAL unit
   GIVEN the presence of a VCL NAL unit with non-escaped slice data
   GIVEN a subscription to the VCL NAL unit type
   THEN the subscribers are notified of the VCL NAL unit comprising the remaining chunk data
   GIVEN any VCL NAL unit following the VCL NAL unit with non-escaped slice data
   GIVEN subscriptions that match the NAL unit type
   THEN the subscribers are not notified of the VCL NAL units
WHEN subscribing to NAL unit by type
GIVEN a chunk containing a single frame in H264 Annex B Byte stream format
GIVEN the SDP indicates embedding format is x-phenix-bitstream=embedded-iso-bmff:2023
GIVEN subscriptions to any combination of non-VCL NAL unit types [0, 6..31]
   GIVEN the presence of non-VCL NAL units preceding the VCL NAL unit with non-escaped slice data
   GIVEN subscriptions that match the non-VCL NAL unit type
   THEN the subscribers are notified with the non-VCL NAL unit
   GIVEN the presence of a VCL NAL unit with non-escaped slice data
   GIVEN any non-VCL NAL units following the VCL NAL unit with non-escaped slice data
   GIVEN subscriptions that match the non-VCL NAL unit types
   THEN the subscribers are not notified of the non-VCL NAL units
 */


   