export const MapMarkerPin = () => {
  const pin = document.createElement("div");
  pin.style.backgroundColor = "#0f52fe";
  pin.style.width = "24px";
  pin.style.height = "24px";
  pin.style.borderRadius = "50%";
  pin.style.border = "3px solid white";
  pin.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
  return pin;
};
