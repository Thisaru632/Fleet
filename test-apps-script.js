const url = "https://script.google.com/macros/s/AKfycbwtQg1_EyscuwxnHP12BXD89mKTYN2pIs9ZYx_TT6sWWa8kK8vxc_iyVkStL0vIZ1Ku/exec";

fetch(url, {
  method: "POST",
  body: JSON.stringify({
    action: "createFolder",
    parentId: "1GE11DsH_D2cnjkp0FSvuJ5qr-U7u9LBl",
    folderName: "TestFolder"
  })
}).then(res => res.text()).then(text => console.log(text.substring(0, 100))).catch(console.error);
