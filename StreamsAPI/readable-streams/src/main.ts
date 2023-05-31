const url = 'https://www.magneticmag.com/.image/t_share/MTYzMjcyMjg2NzkzNjM5MjE0/icspinnzinn.jpg';

async function main() {
  const root = document.querySelector<HTMLDivElement>('#app')
  const imgElement = document.createElement('img');

  const response = await fetch(url, {method: 'GET'}); 
  const reader = response.body?.getReader();

  const readableStream = new ReadableStream({
    start(controller) {
      return pump();

      function pump() {
        return reader?.read().then(({done, value}) => {
          if (done) {
            controller.close();
            return;
          }

           // Enqueue the next data chunk into our target stream
           controller.enqueue(value);
           return pump();
        })
      }
    }
  });

  const imgResponse = new Response(readableStream);
  const imgBlob = URL.createObjectURL(await imgResponse.blob());
  imgElement.src = imgBlob;

  root?.appendChild(imgElement);

}

main();


