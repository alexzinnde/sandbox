/**
 * Copyright 2023 Phenix Real Time Solutions, Inc. Confidential and Proprietary. All Rights Reserved.
 */

import {defineConfig} from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()]
});