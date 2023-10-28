/**
WHEN subscribing to SEI by SEI payload type
GIVEN a chunk containing a single frame in H264 Annex B Byte stream format
GIVEN SDP indicates embedding format is x-phenix-bitstream=embedded-iso-bmff:2023
GIVEN subscriptions to any combination of SEI payload type
   GIVEN the presence of SEI NAL units in the chunk
   GIVEN the SEI NAL units precede the VCL NAL unit with Phenix embedded ISO-BMFF payload data
   GIVEN subscriptions that match the SEI payload type
   THEN the subscribers of the SEI payload type are notified with each of the extracted SEI payloads
 */
