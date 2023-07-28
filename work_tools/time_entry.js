(()=>{
  var body = document.querySelector("body");
  
  let m = document.querySelector('.modal-1')
  
  if (!m){
  // Add HTML
  var div = document.createElement('div');
  var modalHTML = `<div class="micromodal-slide modal is-open" id="modal-1" aria-hidden="false"> <div class="modal__overlay" tabindex="-1" data-micromodal-close=""> <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-1-title"> <header class="modal__header"> <h2 class="modal__title" id="modal-1-title"> Micromodal 🔥 </h2> <button class="modal__close" aria-label="Close modal" data-micromodal-close=""></button> </header> <div class="modal__content" id="modal-1-content"> <p>This is a completely accessible modal.</p> <p> Try hitting the <code>tab</code> key* and notice how the focus stays within the modal itself. To close modal hit the <code>esc</code> button, click on the overlay or just click the close button. </p> <p> <small>* <code>alt+tab</code> in safari</small> </p> </div> <footer class="modal__footer"> <button class="modal__btn modal__btn-primary">Continue</button> <button class="modal__btn" data-micromodal-close="" aria-label="Close this dialog window">Close</button> </footer> </div> </div> </div>
  `;
  div.innerHTML = modalHTML;
  body.appendChild(div);
  }

  // Add Style
  var link = document.createElement("link");
  link.href = "https://gist.githubusercontent.com/ghosh/4f94cf497d7090359a5c9f81caf60699/raw/d9281f3298b46d9cf991b674bc6e1c1ed14e91cc/micromodal.css";
  link.rel = "stylesheet"
  document.head.appendChild(link);
  
  var style = document.createElement("style");
  style.innerHTML = `
  .modal {
    display: none;
  }

  .modal.is-open {
    display: block;
  }
  `;
  
  document.head.appendChild(style);
  
  // Add code
  var script = document.createElement("script");
  script.src = "https://unpkg.com/micromodal/dist/micromodal.min.js";
  script.onload = function(){
    console.log({window})
    window.MicroModal.init();
  }
  div.appendChild(script);

  window.addEventListener("message",(event)=>{
    console.log({event})
  },false
  )

})()