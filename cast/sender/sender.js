
let canCast = false;
window.__onGCastApiAvailable = function (isAvailable) {
  console.log("Api Available: ", isAvailable)
  canCast = isAvailable
  if (!isAvailable) return;


};

document.getElementById("cast").onclick = async () => {
  if(!canCast) {
    console.log("Casting not available");
    return
  }

  const context = cast.framework.CastContext.getInstance()
  
  context.setOptions({
    receiverApplicationId: "C980997E" , //chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    // autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
  });

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