import { isNumber } from 'lodash';
import { Dimensions } from 'react-native';

export type PercentString = `${number}%`;

export type Size = number | PercentString;

/**
 * Base design size.
 *
 * Đây là kích thước màn hình gốc mà UI được design theo.
 * Các giá trị hs, vs, fs... sẽ scale dựa trên kích thước này.
 *
 * Ví dụ:
 * - Design trên Figma đang dùng iPhone 14 Pro Max: 428 x 926
 * - Khi chạy trên màn nhỏ hơn, size sẽ tự giảm theo tỉ lệ
 * - Khi chạy trên màn lớn hơn, size sẽ tự tăng theo tỉ lệ
 */
export const DESIGN_WIDTH = 428;
export const DESIGN_HEIGHT = 926;

/**
 * Dùng window thay vì screen.
 *
 * window = vùng app thực tế render.
 * screen = toàn bộ màn hình thiết bị.
 *
 * Với React Native app bình thường, window thường chính xác hơn cho UI.
 */
export const { width, height } = Dimensions.get('window');

/**
 * shortDimension:
 * - Chiều ngắn hơn của màn hình
 * - Thường dùng để scale theo chiều ngang
 *
 * longDimension:
 * - Chiều dài hơn của màn hình
 * - Thường dùng để scale theo chiều dọc
 *
 * Vì app đã chặn xoay màn hình, giá trị này gần như ổn định.
 */
export const [shortDimension, longDimension] = width < height ? [width, height] : [height, width];
/**
 * Horizontal scale.
 *
 * Dùng cho các size liên quan chiều ngang:
 * - width
 * - paddingHorizontal
 * - marginHorizontal
 * - left / right
 * - borderRadius nếu muốn scale theo ngang
 */
export const hs = <T extends Size>(size: T, baseDesign = DESIGN_WIDTH) => {
  if (typeof size === 'number') {
    return (shortDimension / baseDesign) * size;
  }

  return size;
};

/**
 * Vertical scale.
 *
 * Dùng cho các size liên quan chiều dọc:
 * - height
 * - paddingVertical
 * - marginVertical
 * - top / bottom
 */
export const vs = <T extends Size>(size: T, baseDesign = DESIGN_HEIGHT) => {
  if (typeof size === 'number') {
    return (longDimension / baseDesign) * size;
  }

  return size;
};

/**
 * Font scale.
 *
 * Dùng để scale font nhưng không scale quá mạnh.
 *
 * factor = 0.25 nghĩa là chỉ lấy 25% phần chênh lệch sau khi scale.
 * Cách này giúp font không bị quá to trên màn hình lớn.
 *
 * Với font <= 12 thì giữ nguyên để tránh chữ quá nhỏ / quá lệch.
 */
export const fs = (size: number, factor = 0.25, baseDesign = DESIGN_WIDTH) => {
  if (size <= 12) {
    return size;
  }

  return size + (hs(size, baseDesign) - size) * factor;
};

/**
 * Reverse horizontal scale.
 *
 * Dùng khi cần convert size thật trên màn hình về lại size theo design.
 */
export const rhs = (size: number, baseDesign = DESIGN_WIDTH) => {
  return (baseDesign / shortDimension) * size;
};

/**
 * Reverse vertical scale.
 *
 * Dùng khi cần convert size thật trên màn hình về lại size theo design.
 *
 * Lưu ý:
 * - Vertical phải dùng longDimension
 * - Không dùng shortDimension ở đây
 */
export const rvs = (size: number, baseDesign = DESIGN_HEIGHT) => {
  return (baseDesign / longDimension) * size;
};

/**
 * Moderate horizontal scale.
 *
 * Scale chiều ngang nhưng nhẹ hơn hs.
 *
 * factor = 0.5 nghĩa là scale 50% so với hs gốc.
 * Dùng tốt cho:
 * - borderRadius
 * - padding
 * - margin
 * - icon size
 */
export const mhs = <T extends Size>(size: T, factor = 0.5, baseDesign = DESIGN_WIDTH) => {
  if (typeof size === 'number') {
    return size + (hs(size, baseDesign) - size) * factor;
  }

  return size;
};

/**
 * Moderate vertical scale.
 *
 * Scale chiều dọc nhưng nhẹ hơn vs.
 *
 * Dùng tốt cho:
 * - height
 * - marginVertical
 * - paddingVertical
 * - gap theo chiều dọc
 */
export const mvs = <T extends Size>(size: T, factor = 0.5, baseDesign = DESIGN_HEIGHT) => {
  if (typeof size === 'number') {
    return size + (vs(size, baseDesign) - size) * factor;
  }

  return size;
};

/**
 * Reverse moderate horizontal scale.
 */
export const rmhs = (size: number, factor = 0.5, baseDesign = DESIGN_WIDTH) => {
  return size / (1 - factor + (factor * shortDimension) / baseDesign);
};

/**
 * Reverse moderate vertical scale.
 */
export const rmvs = (size: number, factor = 0.5, baseDesign = DESIGN_HEIGHT) => {
  return size / (1 - factor + (factor * longDimension) / baseDesign);
};

/**
 * Responsive value.
 * Dùng khi không muốn scale theo công thức,
 * mà muốn set value rõ ràng theo từng nhóm màn hình.
 *
 * Phù hợp cho:
 * - input height
 * - button height
 * - gap
 * - padding
 * - layout component
 *
 * Ví dụ:
 * height: rv({ compact: 42, medium: 45, expanded: 48 })
 */
export const rv = (options: { nano?: number; compact?: number; medium?: number; expanded?: number }) => {
  if (shortDimension < 340) {
    return options.nano ?? options.compact ?? 0;
  }

  if (shortDimension < 380) {
    return options.compact ?? 0;
  }

  if (shortDimension < 600) {
    return options.medium ?? options.compact ?? 0;
  }

  return options.expanded ?? options.medium ?? options.compact ?? 0;
};

/**
 * Tạo object vuông.   Ví dụ:  ...handleSquare   * Kết quả:
 * {
 *   width: 40,
 *   height: 40,
 * }
 */
export const handleSquare = (size: number) => {
  const scaledSize = mhs(size);

  return { width: scaledSize, height: scaledSize };
};
/**
 * Tạo object hình tròn.
 *
 * Ví dụ:
 * ...handleRound(40)
 *
 * Kết quả:
 * {
 *   width: 40,
 *   height: 40,
 *   borderRadius: 20,
 * }
 */
export const handleRound = (size: number) => {
  const scaledSize = mhs(size);

  return { width: scaledSize, height: scaledSize, borderRadius: scaledSize / 2 };
};
/**
 * Convert flex dạng boolean hoặc number thành object style.
 * true  => { flex: 1 }
 * false => { flex: 0 }
 * 2     => { flex: 2 }
 */
export const handleFlex = (flex: number | boolean) => {
  return {
    flex: isNumber(flex) ? flex : flex ? 1 : 0,
  };
};

/**
 * Convert flexShrink dạng true hoặc number thành object style.
 *
 * true => { flexShrink: 1 }
 * 2    => { flexShrink: 2 }
 */
export const handleFlexShrink = (flexShrink: number | true) => {
  return { flexShrink: isNumber(flexShrink) ? flexShrink : 1 };
};

/**
 * Convert flexGrow dạng true hoặc number thành object style.
 *
 * true => { flexGrow: 1 }
 * 2    => { flexGrow: 2 }
 */
export const handleFlexGrow = (flexGrow: number | true) => {
  return { flexGrow: isNumber(flexGrow) ? flexGrow : 1 };
};
/**
 * Gom spacing về 4 hướng.
 *
 * Thứ tự ưu tiên:
 * left / top / right / bottom
 * -> horizontal / vertical
 * -> all
 * -> safe area
 * -> 0
 *
 * Lưu ý:
 * Dùng ?? thay vì || để không làm mất giá trị 0.
 */
export const getSpacing = ({
  left,
  top,
  right,
  bottom,
  horizontal,
  vertical,
  all,
  safeTop = 0,
  safeBottom = 0,
  safeLeft = 0,
  safeRight = 0,
}: {
  left?: Size;
  top?: Size;
  right?: Size;
  bottom?: Size;
  horizontal?: Size;
  vertical?: Size;
  all?: Size;
  safeTop?: number;
  safeBottom?: number;
  safeLeft?: number;
  safeRight?: number;
}) => {
  return {
    left: mhs(left ?? horizontal ?? all ?? rhs(safeLeft)),
    top: mvs(top ?? vertical ?? all ?? rvs(safeTop)),
    right: mhs(right ?? horizontal ?? all ?? rhs(safeRight)),
    bottom: mvs(bottom ?? vertical ?? all ?? rvs(safeBottom)),
  };
};

/**
 * Gom border radius về 4 góc.
 *
 * Thứ tự ưu tiên:
 * topLeft / topRight / bottomLeft / bottomRight
 * -> top / bottom / left / right
 * -> all
 * -> 0
 *
 * Lưu ý:
 * Dùng ?? thay vì || để giữ được giá trị 0.
 */
export const getBorderRadius = ({
  left,
  top,
  right,
  bottom,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  all,
}: {
  left?: Size;
  top?: Size;
  right?: Size;
  bottom?: Size;
  topLeft?: Size;
  topRight?: Size;
  bottomLeft?: Size;
  bottomRight?: Size;
  all?: Size;
}) => {
  return {
    topLeft: mhs(topLeft ?? top ?? left ?? all ?? 0),
    topRight: mhs(topRight ?? top ?? right ?? all ?? 0),
    bottomLeft: mhs(bottomLeft ?? bottom ?? left ?? all ?? 0),
    bottomRight: mhs(bottomRight ?? bottom ?? right ?? all ?? 0),
  };
};
