const RtspServer = require('rtsp-streaming-server').default

const server = new RtspServer({
  serverPort: 5554,
  clientPort: 6554,
  rtpPortStart: 10000,
  rtpPortCount: 10000,
  publishServerHooks: {
    checkMount(req) {
      console.log('PublishServer checkMount req [%o]', req);

      return true;
    },
  },
  clientServerHooks: { 
    checkMount(req) {
      console.log('clientServerHooks checkMount req [%o]', req);

      return true;
    },
  }
})

async function run() {
  try {
    await server.start()
    console.log('RTP Server Started [%o]', server)
  } catch (e) {
    console.error(e)
  }
}

run()
