
window.__onGCastApiAvailable = function (isAvailable) {
  console.log("Api Available: ", isAvailable)
  
  if (!isAvailable) return;

  cast.framework.CastContext.getInstance().setOptions({
    receiverApplicationId: "C980997E" , //chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
  });
};

document.getElementById("cast").onclick = async () => {
  const context = cast.framework.CastContext.getInstance();
  try {
        const session = await context.requestSession();

        const message = {
            type: "LOAD_VIEW",
            view: "dashboard",
            user: "demo"
        };
        session.sendMessage("urn:x-cast:com.example.view", message);
  } catch(e){
      console.log("could not send the message")
      console.log(e)
  }
};