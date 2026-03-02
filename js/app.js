const onReady = async () => {
  const btn = document.getElementById("printButton");
  if (btn) {
    btn.onclick = function () {
      window.print();
    };
  }
};
