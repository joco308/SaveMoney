export const colors = {
  primary: "#00664A",
  primaryDark: "#005139",
  mint: "#6FF9BE",
  mintSoft: "#D2FBE7",
  bg: "#F5F6FD",
  card: "#FFFFFF",
  blueSoft: "#E4EAFF",
  blueSofter: "#EDF1FF",
  text: "#0F1B33",
  textSoft: "#5B6478",
  red: "#B5191F",
  redSoft: "#FDE6E6",
  amber: "#F39C12",
  amberSoft: "#FFF1DC",
  gray: "#BFC6DC",
  green: "#4ADE9E",
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const font = {
  r: "PlusJakartaSans_400Regular",
  m: "PlusJakartaSans_500Medium",
  sb: "PlusJakartaSans_600SemiBold",
  b: "PlusJakartaSans_700Bold",
  xb: "PlusJakartaSans_800ExtraBold",
};

export const money = (n: number, decimals = 2) => {
  const neg = n < 0;
  const [i, d] = Math.abs(n).toFixed(decimals).split(".");
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "-" : ""}Bs ${int}${decimals ? "," + d : ""}`;
};
