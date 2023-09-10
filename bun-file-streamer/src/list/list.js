const listContainer = document.getElementById('list-container');
const listElement = document.createElement('ul');

async function getFileList() {
  const res = await fetch('/filelist');
  const fileList = await res.json();

  fileList.forEach(fileName => {
    const fileListItem = document.createElement('li');
    const fileListButton = document.createElement('div');
    fileListButton.innerText = fileName;
    fileListButton.onclick = () => {
      window.location.href = `/file?name=${encodeURIComponent(fileName)}`;
    };
    fileListItem.appendChild(fileListButton);
    listElement.appendChild(fileListItem);
  });

  listContainer.appendChild(listElement);
}

getFileList();
