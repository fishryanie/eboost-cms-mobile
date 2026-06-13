const DESIGN_WIDTH = 428;
const DESIGN_HEIGHT = 926;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value);
}

export function getServiceSheetMetrics(width: number, height: number) {
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const scale = clamp(Math.min(shortSide / DESIGN_WIDTH, longSide / DESIGN_HEIGHT), 0.84, 1);
  const fontScale = clamp(scale, 0.84, 0.94);
  const size = (value: number) => round(value * scale);
  const font = (value: number) => round(value * fontScale);

  return {
    cardGap: size(8),
    cardPadding: size(12),
    descriptionFontSize: font(12),
    descriptionLineHeight: font(17),
    footerGap: size(8),
    footerPaddingHorizontal: size(12),
    footerPaddingTop: size(8),
    formGap: size(8),
    headerGap: size(12),
    headerPaddingBottom: size(12),
    headerPaddingHorizontal: size(12),
    headerPaddingTop: size(8),
    infoPillMinWidth: size(130),
    inputFontSize: font(12),
    inputLineHeight: font(18),
    inputMinHeight: size(40),
    inputPaddingHorizontal: size(12),
    inputPaddingVertical: size(10),
    itemGap: size(12),
    itemPaddingHorizontal: size(12),
    itemPaddingVertical: size(10),
    itemSubtitleFontSize: font(11),
    itemSubtitleLineHeight: font(16),
    itemTitleFontSize: font(13),
    itemTitleLineHeight: font(18),
    loadingFontSize: font(13),
    loadingLineHeight: font(18),
    metricValueFontSize: font(16),
    metricValueLineHeight: font(22),
    modalCloseSize: size(34),
    noticeFontSize: font(12),
    noticeLineHeight: font(17),
    radioDotSize: size(8),
    radioSize: size(22),
    responseIconSize: size(52),
    responsePadding: size(12),
    responseTitleFontSize: font(18),
    responseTitleLineHeight: font(23),
    sectionGap: size(8),
    titleFontSize: font(18),
    titleLineHeight: font(23),
  };
}

export type ServiceSheetMetrics = ReturnType<typeof getServiceSheetMetrics>;
