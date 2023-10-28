/***
WHEN subscribing to a payload by UUID
GIVEN a chunk containing a single frame in H264 Annex B Byte stream format
GIVEN embedding format is x-phenix-bitstream=embedded-iso-bmff:2023
GIVEN a subscription to UUID 0
    GIVEN truncated VCL NAL units preceding the VCL-NAL unit with Phenix embedded ISO-BMFF payload data
    THEN the extractor does not notify subscribers
    GIVEN the presence of a VCL-NAL unit with Phenix embedded ISO-BMFF payload data
    THEN the extractor notifies subscribers
    THEN the extracted data is the Phenix embedded ISO-BMFF payload data
    
WHEN subscribing to a payload by UUID
GIVEN a chunk containing a single frame in H264 Annex B Byte stream format
GIVEN embedding format is x-phenix-bitstream=embedded-iso-bmff:2023
GIVEN a subscription to UUID 0
GIVEN no VCL-NAL unit with Phenix embedded ISO-BMFF payload data
THEN the extractor logs a warning indicating that it could not find embedded ISOBMFF data
WHEN extracting data from encoded frames for the purpose of appending data to the MSE source buffer
GIVEN a chunk containing a single frame in H264 Annex B Byte stream format
GIVEN embedding format is x-phenix-bitstream=embedded-iso-bmff:2023
   GIVEN a subscription to a UUID
   GIVEN a chunk containing SEI type 5 (User Unregistered Data) NAL units with UUID precedes the VCL-NAL unit with Phenix embedded ISO-BMFF payload data
   THEN the extractor notifies subscribers to UUID
   THEN the extracted data is the payload of SEI type 5 (User Unregistered Data)
   GIVEN no subscription to UUID
   GIVEN a chunk containing SEI type 5 (User Unregistered Data) NAL units with UUID precedes the VCL-NAL unit with Phenix embedded ISO-BMFF payload data
   GIVEN the UUID has not been previously received
   THEN the extractor logs a warning that an unexpected UUID has been received
*/
