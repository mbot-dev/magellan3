export const APP_MENU_SPEC = {
  entity: "mainMenus",
  entries: [
    { path: "/patient", label: "受付", icon: "pvt" },
    { path: "/karte", label: "カルテ", icon: "karte" },
    { path: "/accounting", label: "会計", icon: "accounting" },
    { path: "/receipt", label: "レセ", icon: "receipt" },
    { path: "/notify", label: "通知", icon: "notify" },
    { path: "/lab-receiver", label: "検査", icon: "labReceiver" },
    { path: "/tool", label: "診療行為", icon: "tool" },
    { path: "/facility", label: "病院設定", icon: "facility" },
    { path: "--grow--", label: "", icon: "" },
    { path: "/settings", label: "ユーザ", icon: "settings" },
  ],
};
