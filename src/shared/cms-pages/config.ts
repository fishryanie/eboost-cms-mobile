export type CmsValueFormat = 'boolean' | 'currency' | 'date' | 'dateTime' | 'energy' | 'number' | 'text';

export type CmsFieldConfig = {
  format?: CmsValueFormat;
  label: string;
  paths: string[];
};

export type CmsSectionVariant = 'brand' | 'default' | 'opening-hours' | 'rich-content' | 'tariff';

export type CmsEditorFieldType = 'boolean' | 'currency' | 'date' | 'image' | 'multiline' | 'number' | 'select' | 'text' | 'time';

export type CmsEditorOption = {
  label: string;
  value: boolean | number | string;
};

export type CmsEditorLookup = {
  endpoint: string;
  labelPaths: string[];
  params?: Record<string, boolean | number | string>;
  valuePaths: string[];
};

export type CmsEditorFieldConfig = {
  defaultValue?: boolean | number | string;
  group?: string;
  help?: string;
  key: string;
  label: string;
  lookup?: CmsEditorLookup;
  multiline?: boolean;
  options?: CmsEditorOption[];
  placeholder?: string;
  required?: boolean;
  type?: CmsEditorFieldType;
  visibleWhen?: {
    key: string;
    notValue?: boolean | number | string;
    value?: boolean | number | string;
  };
};

export type CmsEditorVariant = 'default' | 'opening-hours' | 'reservation-policy' | 'tariff';

export type CmsImageUploadConfig = {
  folder: string;
  resultKey?: string;
  target?: 'entity' | 'temporary';
};

export type CmsEditorConfig = {
  create?: boolean;
  createMethod?: 'POST' | 'PUT';
  entityLabel?: string;
  fields?: CmsEditorFieldConfig[];
  imageUpload?: CmsImageUploadConfig;
  update?: boolean;
  updateMethod?: 'PATCH' | 'PUT';
  variant?: CmsEditorVariant;
};

export type CmsSectionConfig = {
  editor?: CmsEditorConfig;
  endpoint: string;
  fields: CmsFieldConfig[];
  imagePaths?: string[];
  key: string;
  label: string;
  params?: Record<string, boolean | number | string>;
  searchParam?: string;
  statusPaths?: string[];
  subtitlePaths?: string[];
  titlePaths: string[];
  variant?: CmsSectionVariant;
};

export type CmsPageAction = {
  href: string;
  label: string;
};

export type CmsPageConfig = {
  accentColor: string;
  action?: CmsPageAction;
  description: string;
  sections: CmsSectionConfig[];
  title: string;
};

const operationAccent = '#E46B2C';
const marketingAccent = '#D64A7F';

export const cmsPageConfigs = {
  tariff: {
    accentColor: operationAccent,
    description: 'Charging fees by profile, weekday, time window, and connector direction.',
    sections: [
      {
        endpoint: 'api/port_profiles',
        editor: { variant: 'tariff' },
        fields: [],
        key: 'profiles',
        label: 'Port profiles',
        searchParam: 'name',
        statusPaths: ['enabled'],
        subtitlePaths: ['nameVn'],
        titlePaths: ['name'],
        variant: 'tariff',
      },
    ],
    title: 'Tariff',
  },
  'opening-hours': {
    accentColor: operationAccent,
    description: 'Opening schedules grouped by station profile and weekday.',
    sections: [
      {
        endpoint: 'api/station_open_profiles',
        editor: { variant: 'opening-hours' },
        fields: [],
        key: 'profiles',
        label: 'Profiles',
        searchParam: 'name',
        subtitlePaths: ['nameVn'],
        titlePaths: ['name'],
        variant: 'opening-hours',
      },
    ],
    title: 'Opening Hours',
  },
  reservations: {
    accentColor: operationAccent,
    description: 'Reservation activity and the policies that control booking behavior.',
    sections: [
      {
        endpoint: 'api/port_reservations',
        fields: [
          { format: 'dateTime', label: 'Reserved from', paths: ['reservedFrom'] },
          { format: 'dateTime', label: 'Reserved until', paths: ['reservedUntil'] },
          { label: 'Vehicle', paths: ['vehicleType', 'vehicle.type'] },
          { label: 'Outlet', paths: ['outlet.name', 'outlet.uniqueId', 'carConnector.name'] },
        ],
        key: 'histories',
        label: 'History',
        searchParam: 'user.phoneNumber',
        statusPaths: ['status'],
        subtitlePaths: ['user.phoneNumber', 'user.email', 'note'],
        titlePaths: ['user.name', 'user.fullName', 'user.phoneNumber', 'id'],
      },
      {
        endpoint: 'api/port_reservation_policies',
        editor: {
          entityLabel: 'Reservation Policy',
          variant: 'reservation-policy',
          fields: [
            {
              defaultValue: 'all',
              group: 'Audience',
              key: 'targetType',
              label: 'Apply to',
              options: [
                { label: 'All users', value: 'all' },
                { label: 'User level', value: 'user-level' },
                { label: 'User group', value: 'user-group' },
                { label: 'Specific user', value: 'user' },
              ],
              required: true,
              type: 'select',
            },
            {
              group: 'Audience',
              key: 'userLevel',
              label: 'User level',
              lookup: { endpoint: 'api/user_levels', labelPaths: ['name'], params: { pagination: false }, valuePaths: ['iriId', '@id'] },
              required: true,
              type: 'select',
              visibleWhen: { key: 'targetType', value: 'user-level' },
            },
            {
              group: 'Audience',
              key: 'userGroup',
              label: 'User group',
              lookup: { endpoint: 'api/user_groups', labelPaths: ['name'], params: { pagination: false }, valuePaths: ['iriId', '@id'] },
              required: true,
              type: 'select',
              visibleWhen: { key: 'targetType', value: 'user-group' },
            },
            {
              group: 'Audience',
              help: 'Enter a user ID or a full /api/users/... identifier.',
              key: 'user',
              label: 'User ID',
              required: true,
              type: 'text',
              visibleWhen: { key: 'targetType', value: 'user' },
            },
            { defaultValue: 1000, group: 'Fees', key: 'fee', label: 'Reservation fee', required: true, type: 'currency' },
            { defaultValue: 20000, group: 'Fees', key: 'penaltyFee', label: 'Penalty fee', required: true, type: 'currency' },
            {
              defaultValue: 10,
              group: 'Timing rules',
              key: 'reservationGracePeriodMinutes',
              label: 'Grace period (minutes)',
              required: true,
              type: 'number',
            },
            {
              defaultValue: 60,
              group: 'Timing rules',
              key: 'reservationMaxAdvanceMinutes',
              label: 'Maximum advance (minutes)',
              required: true,
              type: 'number',
            },
            {
              defaultValue: 15,
              group: 'Timing rules',
              key: 'reservationSlotStepMinutes',
              label: 'Slot step (minutes)',
              required: true,
              type: 'number',
            },
            {
              defaultValue: 5,
              group: 'Timing rules',
              key: 'reservationSlotIntervalMinutes',
              label: 'Slot interval (minutes)',
              required: true,
              type: 'number',
            },
            { defaultValue: 1, group: 'Limits', key: 'maxReservationsPerDay', label: 'Maximum per day', required: true, type: 'number' },
            { defaultValue: 0, group: 'Limits', key: 'priority', label: 'Priority', required: true, type: 'number' },
            { defaultValue: true, group: 'Status', key: 'enabled', label: 'Enabled', type: 'boolean' },
          ],
        },
        fields: [
          { format: 'currency', label: 'Reservation fee', paths: ['fee'] },
          { format: 'currency', label: 'Penalty fee', paths: ['penaltyFee'] },
          { format: 'number', label: 'Grace period', paths: ['reservationGracePeriodMinutes'] },
          { format: 'number', label: 'Daily limit', paths: ['maxReservationsPerDay'] },
        ],
        key: 'policies',
        label: 'Policies',
        statusPaths: ['enabled'],
        subtitlePaths: ['user.name', 'userGroup.name', 'userLevel.name'],
        titlePaths: ['name', 'user.name', 'userGroup.name', 'userLevel.name', 'id'],
      },
    ],
    title: 'Reservations',
  },
  payments: {
    accentColor: operationAccent,
    description: 'Payment attempts, provider results, and reconciliation details.',
    sections: [
      {
        endpoint: 'api/momo_histories',
        fields: [
          { format: 'currency', label: 'Amount', paths: ['amount'] },
          { label: 'Transaction ID', paths: ['transId', 'requestId'] },
          { format: 'dateTime', label: 'Created', paths: ['createdAt'] },
        ],
        key: 'momo',
        label: 'MoMo',
        searchParam: 'orderId',
        statusPaths: ['status', 'errorMessage'],
        subtitlePaths: ['userName', 'userPhone', 'userEmail'],
        titlePaths: ['orderId', 'requestId', 'id'],
      },
      {
        endpoint: 'api/ale_pay_histories',
        fields: [
          { format: 'currency', label: 'Amount', paths: ['amount', 'requestAmount'] },
          { label: 'Transaction code', paths: ['transactionCode'] },
          { label: 'Method', paths: ['method', 'bankName'] },
          { format: 'dateTime', label: 'Created', paths: ['createdAt'] },
        ],
        key: 'alepay',
        label: 'AlePay',
        searchParam: 'orderCode',
        statusPaths: ['status', 'isDone'],
        subtitlePaths: ['buyerName', 'buyerPhone', 'buyerEmail'],
        titlePaths: ['orderCode', 'transactionCode', 'id'],
      },
    ],
    title: 'Payments',
  },
  transactions: {
    accentColor: operationAccent,
    description: 'Charging sessions for cars and bikes, including energy and billing totals.',
    sections: [
      {
        endpoint: 'api/car_charge_histories',
        fields: [
          { format: 'energy', label: 'Energy', paths: ['wattageConsumed'] },
          { format: 'currency', label: 'Total fee', paths: ['totalFee', 'paid'] },
          { format: 'dateTime', label: 'Started', paths: ['startTime', 'startTimeDate'] },
          { label: 'Station', paths: ['carBox.station.name', 'outlet.name', 'carBox.uniqueId'] },
        ],
        key: 'car',
        label: 'Cars',
        searchParam: 'invoiceId',
        statusPaths: ['status', 'reasonClosed'],
        subtitlePaths: ['user.phoneNumber', 'user.email', 'transactionId'],
        titlePaths: ['invoiceId', 'transactionId', 'id'],
      },
      {
        endpoint: 'api/bike_charge_histories',
        fields: [
          { format: 'energy', label: 'Energy', paths: ['wattageConsumed'] },
          { format: 'currency', label: 'Total fee', paths: ['totalFee', 'paid'] },
          { format: 'dateTime', label: 'Started', paths: ['startTime', 'startTimeDate'] },
          { label: 'Station', paths: ['bikeBox.station.name', 'outlet.name', 'bikeBox.uniqueId'] },
        ],
        key: 'bike',
        label: 'Bikes',
        searchParam: 'invoiceId',
        statusPaths: ['status', 'reasonClosed'],
        subtitlePaths: ['user.phoneNumber', 'user.email', 'transactionId'],
        titlePaths: ['invoiceId', 'transactionId', 'id'],
      },
    ],
    title: 'Transactions',
  },
  contents: {
    accentColor: operationAccent,
    description: 'App-facing FAQs, privacy policy, and terms and conditions.',
    sections: [
      {
        endpoint: 'api/faqs',
        editor: {
          entityLabel: 'FAQ',
          updateMethod: 'PUT',
          fields: [
            {
              group: 'Category',
              key: 'faqSection',
              label: 'FAQ section',
              lookup: { endpoint: 'api/faq_sections', labelPaths: ['name'], params: { pagination: false }, valuePaths: ['iriId', '@id'] },
              required: true,
              type: 'select',
            },
            { group: 'English', key: 'question', label: 'Question', required: true, type: 'multiline' },
            { group: 'English', key: 'answer', label: 'Answer', required: true, type: 'multiline' },
            { group: 'Vietnamese', key: 'questionVn', label: 'Question', required: true, type: 'multiline' },
            { group: 'Vietnamese', key: 'answerVn', label: 'Answer', required: true, type: 'multiline' },
          ],
        },
        fields: [
          { label: 'Section', paths: ['faqSection.name', 'section.name'] },
          { format: 'date', label: 'Created', paths: ['createdAt'] },
        ],
        key: 'faqs',
        label: 'FAQs',
        searchParam: 'question',
        subtitlePaths: ['questionVn', 'answer'],
        titlePaths: ['question', 'id'],
      },
      {
        endpoint: 'api/static_contents/privacy-policy',
        editor: {
          create: false,
          updateMethod: 'PUT',
          fields: [
            { group: 'English', key: 'content', label: 'Privacy policy', required: true, type: 'multiline' },
            { group: 'Vietnamese', key: 'contentVn', label: 'Chính sách bảo mật', type: 'multiline' },
          ],
        },
        fields: [{ label: 'Content', paths: ['content', 'value', 'body'] }],
        key: 'privacy-policy',
        label: 'Privacy',
        params: { language: 'en' },
        subtitlePaths: ['content', 'value', 'body'],
        titlePaths: ['title', 'name'],
        variant: 'rich-content',
      },
      {
        endpoint: 'api/static_contents/terms-conditions',
        editor: {
          create: false,
          updateMethod: 'PUT',
          fields: [
            { group: 'English', key: 'content', label: 'Terms and conditions', required: true, type: 'multiline' },
            { group: 'Vietnamese', key: 'contentVn', label: 'Điều khoản và điều kiện', type: 'multiline' },
          ],
        },
        fields: [{ label: 'Content', paths: ['content', 'value', 'body'] }],
        key: 'terms-conditions',
        label: 'Terms',
        params: { language: 'en' },
        subtitlePaths: ['content', 'value', 'body'],
        titlePaths: ['title', 'name'],
        variant: 'rich-content',
      },
    ],
    title: 'Contents',
  },
  brands: {
    accentColor: operationAccent,
    description: 'Vehicle brands, model inventory, and supported vehicle types.',
    sections: [
      {
        endpoint: 'api/brands',
        editor: {
          entityLabel: 'Brand',
          fields: [
            { group: 'Brand', key: 'name', label: 'Brand name', required: true },
            { group: 'Brand', key: 'imageFile', label: 'Brand logo', type: 'image' },
          ],
          imageUpload: { folder: 'brand' },
        },
        fields: [
          { format: 'number', label: 'Models', paths: ['numberOfModels'] },
          { format: 'number', label: 'Outlets', paths: ['numberOfOutlets'] },
        ],
        imagePaths: ['image.url', 'image.path'],
        key: 'brands',
        label: 'Brands',
        searchParam: 'name',
        subtitlePaths: ['brandModels.0.name'],
        titlePaths: ['name', 'id'],
        variant: 'brand',
      },
    ],
    title: 'Brands & Models',
  },
  promotions: {
    accentColor: marketingAccent,
    action: { href: '/marketing/create-promo-code', label: 'Create' },
    description: 'Charging and wallet promotions with usage and approval state.',
    sections: [
      {
        endpoint: 'api/promotion_codes',
        editor: {
          create: false,
          entityLabel: 'Promotion Code',
          fields: [
            { group: 'Identity', key: 'code', label: 'Promotion code', required: true },
            { group: 'Identity', key: 'name', label: 'Name (English)', required: true },
            { group: 'Identity', key: 'nameVn', label: 'Name (Vietnamese)', required: true },
            { group: 'Content', key: 'description', label: 'Description (English)', type: 'multiline' },
            { group: 'Content', key: 'descriptionVn', label: 'Description (Vietnamese)', type: 'multiline' },
            { group: 'Content', key: 'note', label: 'Internal note', type: 'multiline' },
            { group: 'Discount', key: 'discountPercent', label: 'Discount percent', required: true, type: 'number' },
            { group: 'Discount', key: 'maxDiscountAmount', label: 'Maximum discount', type: 'currency' },
            { group: 'Limits', key: 'maxTotalUsage', label: 'Maximum total usage', type: 'number' },
            { group: 'Limits', key: 'maxUsagePerUser', label: 'Maximum usage per user', type: 'number' },
            {
              defaultValue: 0,
              group: 'Audience',
              key: 'vehicleType',
              label: 'Vehicle type',
              options: [
                { label: 'All', value: 0 },
                { label: 'Car', value: 'car' },
                { label: 'Bike', value: 'bike' },
              ],
              type: 'select',
            },
            { group: 'Validity', key: 'startAt', label: 'Start date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { group: 'Validity', key: 'expiredAt', label: 'Expiry date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { defaultValue: false, group: 'Status', key: 'enabled', label: 'Enabled', type: 'boolean' },
            { defaultValue: false, group: 'Status', key: 'visible', label: 'Visible', type: 'boolean' },
            { defaultValue: false, group: 'Status', key: 'monopoly', label: 'Monopoly', type: 'boolean' },
          ],
        },
        fields: [
          { format: 'number', label: 'Discount', paths: ['discountPercent'] },
          { format: 'currency', label: 'Max discount', paths: ['maxDiscountAmount'] },
          { format: 'number', label: 'Usage', paths: ['currentTotalUsage'] },
          { format: 'date', label: 'Expires', paths: ['expiredAt'] },
        ],
        key: 'charging',
        label: 'Charging',
        searchParam: 'code',
        statusPaths: ['enabled'],
        subtitlePaths: ['name', 'description', 'note'],
        titlePaths: ['code', 'name', 'id'],
      },
      {
        endpoint: 'api/promotion_moneys',
        editor: {
          entityLabel: 'Wallet Promotion',
          updateMethod: 'PUT',
          fields: [
            { group: 'Identity', key: 'code', label: 'Promotion code', required: true },
            { group: 'Identity', key: 'name', label: 'Name (English)', required: true },
            { group: 'Identity', key: 'nameVn', label: 'Name (Vietnamese)', required: true },
            { group: 'Content', key: 'description', label: 'Description (English)', type: 'multiline' },
            { group: 'Content', key: 'descriptionVn', label: 'Description (Vietnamese)', type: 'multiline' },
            { group: 'Content', key: 'note', label: 'Internal note', type: 'multiline' },
            { group: 'Value', key: 'moneyGift', label: 'Gift amount', required: true, type: 'currency' },
            { group: 'Value', key: 'minRequired', label: 'Minimum required', type: 'currency' },
            { group: 'Value', key: 'maxRequired', label: 'Maximum required', type: 'currency' },
            { group: 'Limits', key: 'maxTotalUsage', label: 'Maximum total usage', type: 'number' },
            { group: 'Limits', key: 'maxUsagePerUser', label: 'Maximum usage per user', type: 'number' },
            { group: 'Validity', key: 'startAt', label: 'Start date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { group: 'Validity', key: 'expiredAt', label: 'Expiry date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { defaultValue: false, group: 'Status', key: 'enabled', label: 'Enabled', type: 'boolean' },
            { defaultValue: false, group: 'Status', key: 'visible', label: 'Visible', type: 'boolean' },
          ],
        },
        fields: [
          { format: 'currency', label: 'Gift', paths: ['moneyGift'] },
          { format: 'currency', label: 'Minimum', paths: ['minRequired'] },
          { format: 'number', label: 'Usage', paths: ['currentTotalUsage'] },
          { format: 'date', label: 'Expires', paths: ['expiredAt'] },
        ],
        key: 'wallet',
        label: 'Wallet',
        searchParam: 'code',
        statusPaths: ['enabled'],
        subtitlePaths: ['name', 'description', 'note'],
        titlePaths: ['code', 'name', 'id'],
      },
      {
        endpoint: 'api/promotion_code_useds',
        fields: [
          { format: 'currency', label: 'Discount', paths: ['discountAmount'] },
          { label: 'Invoice', paths: ['invoiceId'] },
          { format: 'dateTime', label: 'Used', paths: ['usedAt'] },
        ],
        key: 'code-usage',
        label: 'Code usage',
        searchParam: 'code',
        statusPaths: ['isUsed'],
        subtitlePaths: ['userName', 'userPhone', 'invoiceId'],
        titlePaths: ['code', 'id'],
      },
      {
        endpoint: 'api/promotion_money_useds',
        fields: [
          { format: 'currency', label: 'Discount', paths: ['discountAmount'] },
          { label: 'Payment', paths: ['paymentId'] },
          { format: 'dateTime', label: 'Used', paths: ['usedAt'] },
        ],
        key: 'money-usage',
        label: 'Money usage',
        searchParam: 'code',
        subtitlePaths: ['userName', 'userPhone', 'paymentId'],
        titlePaths: ['code', 'id'],
      },
    ],
    title: 'Promotions',
  },
  'bonus-topup': {
    accentColor: marketingAccent,
    action: { href: '/marketing/create-bonus-campaign', label: 'Create' },
    description: 'Top-up bonus campaigns, rules, limits, and redemption history.',
    sections: [
      {
        endpoint: 'api/money_top_up_events',
        editor: {
          create: false,
          entityLabel: 'Bonus Campaign',
          updateMethod: 'PUT',
          fields: [
            { group: 'Identity', key: 'name', label: 'Name (English)', required: true },
            { group: 'Identity', key: 'nameVn', label: 'Name (Vietnamese)', required: true },
            { group: 'Content', key: 'description', label: 'Description (English)', type: 'multiline' },
            { group: 'Content', key: 'descriptionVn', label: 'Description (Vietnamese)', type: 'multiline' },
            { group: 'Validity', key: 'beginAt', label: 'Begin date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { group: 'Validity', key: 'endAt', label: 'End date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { group: 'Top-up range', key: 'topUpAmountMin', label: 'Minimum top-up', required: true, type: 'currency' },
            { group: 'Top-up range', key: 'topUpAmountMax', label: 'Maximum top-up', required: true, type: 'currency' },
            { group: 'Bonus range', key: 'bonusAmountMin', label: 'Minimum bonus', required: true, type: 'currency' },
            { group: 'Bonus range', key: 'bonusAmountMax', label: 'Maximum bonus', required: true, type: 'currency' },
            { group: 'Limits', key: 'maxTotalUsage', label: 'Maximum total usage', type: 'number' },
            { group: 'Limits', key: 'maxUsagePerUser', label: 'Maximum usage per user', type: 'number' },
            {
              defaultValue: 0,
              group: 'Audience',
              key: 'userType',
              label: 'User type',
              options: [
                { label: 'All users', value: 0 },
                { label: 'New users', value: 1 },
                { label: 'Old users', value: 2 },
              ],
              type: 'select',
            },
            {
              group: 'Audience',
              key: 'userAffectedAt',
              label: 'User affected at',
              placeholder: 'YYYY-MM-DD',
              required: true,
              type: 'date',
              visibleWhen: { key: 'userType', notValue: 0 },
            },
            { defaultValue: false, group: 'Status', key: 'isActive', label: 'Active', type: 'boolean' },
          ],
        },
        fields: [
          { format: 'currency', label: 'Top-up min', paths: ['topUpAmountMin'] },
          { format: 'currency', label: 'Bonus max', paths: ['bonusAmountMax'] },
          { format: 'number', label: 'Usage', paths: ['currentTotalUsage'] },
          { format: 'date', label: 'Ends', paths: ['endAt'] },
        ],
        key: 'campaigns',
        label: 'Campaigns',
        searchParam: 'name',
        statusPaths: ['isActive'],
        subtitlePaths: ['nameVn', 'description'],
        titlePaths: ['name', 'id'],
      },
      {
        endpoint: 'api/money_top_up_usages',
        fields: [
          { format: 'currency', label: 'Top-up', paths: ['topUpAmount', 'amount', 'moneyTopUp'] },
          { format: 'currency', label: 'Bonus', paths: ['bonusAmount', 'moneyGift', 'promotionAmount'] },
          { format: 'dateTime', label: 'Created', paths: ['createdAt'] },
        ],
        key: 'usage',
        label: 'Usage',
        searchParam: 'orderId',
        subtitlePaths: ['user.name', 'user.phoneNumber', 'requestId'],
        titlePaths: ['orderId', 'orderCode', 'event.name', 'id'],
      },
    ],
    title: 'Bonus Topup',
  },
  'referral-gift': {
    accentColor: marketingAccent,
    description: 'Referral rewards for owners and invited users.',
    sections: [
      {
        endpoint: 'api/referral_gifts',
        editor: {
          entityLabel: 'Referral Gift',
          updateMethod: 'PUT',
          fields: [
            { group: 'Gift', key: 'name', label: 'Name', required: true },
            { group: 'Gift', key: 'rate', label: 'Rate', type: 'number' },
            { group: 'Reward', key: 'moneyGift', label: 'Invitee gift', type: 'currency' },
            { group: 'Reward', key: 'moneyOwner', label: 'Owner gift', type: 'currency' },
            {
              group: 'Linked promotion',
              key: 'promotionCode',
              label: 'Promotion code',
              lookup: { endpoint: 'api/promotion_codes', labelPaths: ['code', 'name'], params: { pagination: false }, valuePaths: ['iriId', '@id'] },
              type: 'select',
            },
            {
              group: 'Linked promotion',
              key: 'promotionMoney',
              label: 'Promotion money',
              lookup: { endpoint: 'api/promotion_moneys', labelPaths: ['code', 'name'], params: { pagination: false }, valuePaths: ['iriId', '@id'] },
              type: 'select',
            },
            { defaultValue: true, group: 'Status', key: 'enabled', label: 'Enabled', type: 'boolean' },
          ],
        },
        fields: [
          { format: 'number', label: 'Rate', paths: ['rate'] },
          { format: 'currency', label: 'Invitee gift', paths: ['moneyGift'] },
          { format: 'currency', label: 'Owner gift', paths: ['moneyOwner'] },
          { format: 'date', label: 'Created', paths: ['createdAt'] },
        ],
        key: 'gifts',
        label: 'Gifts',
        searchParam: 'name',
        statusPaths: ['enabled'],
        subtitlePaths: ['promotionCode.code', 'promotionMoney.code'],
        titlePaths: ['name', 'id'],
      },
    ],
    title: 'Referral Gift',
  },
  'notification-message-templates': {
    accentColor: marketingAccent,
    action: { href: '/marketing/push-notice', label: 'Send' },
    description: 'Reusable bilingual messages for immediate and scheduled notifications.',
    sections: [
      {
        endpoint: 'api/notification_message_templates',
        editor: {
          entityLabel: 'Notification Template',
          fields: [
            { group: 'Media', key: 'imageFile', label: 'Template image', type: 'image' },
            { group: 'Identity', key: 'name', label: 'Name (English)', required: true },
            { group: 'Identity', key: 'nameVn', label: 'Name (Vietnamese)', required: true },
            { group: 'Notification', key: 'titleEn', label: 'Title (English)', required: true },
            { group: 'Notification', key: 'titleVn', label: 'Title (Vietnamese)', required: true },
            { group: 'Notification', key: 'messageEn', label: 'Message (English)', required: true, type: 'multiline' },
            { group: 'Notification', key: 'messageVn', label: 'Message (Vietnamese)', required: true, type: 'multiline' },
            { group: 'Detail', key: 'description', label: 'Description (English)', type: 'multiline' },
            { group: 'Detail', key: 'descriptionVn', label: 'Description (Vietnamese)', type: 'multiline' },
            { group: 'Detail', key: 'contentEn', label: 'Content (English)', required: true, type: 'multiline' },
            { group: 'Detail', key: 'contentVn', label: 'Content (Vietnamese)', required: true, type: 'multiline' },
            { group: 'Version', key: 'version', label: 'Version' },
          ],
          imageUpload: { folder: 'notification', resultKey: 'imageUrl', target: 'temporary' },
        },
        fields: [
          { label: 'English title', paths: ['titleEn'] },
          { label: 'Vietnamese title', paths: ['titleVn'] },
          { label: 'Version', paths: ['version'] },
        ],
        imagePaths: ['imageUrl'],
        key: 'templates',
        label: 'Templates',
        searchParam: 'name',
        statusPaths: ['deletedAt'],
        subtitlePaths: ['messageVn', 'messageEn', 'description'],
        titlePaths: ['name', 'nameVn', 'id'],
      },
    ],
    title: 'Notification Templates',
  },
  advertisements: {
    accentColor: marketingAccent,
    description: 'In-app advertising placements, validity windows, and click activity.',
    sections: [
      {
        endpoint: 'api/advertisements',
        editor: {
          entityLabel: 'Advertisement',
          fields: [
            { group: 'Media', key: 'imageFile', label: 'Advertisement image', type: 'image' },
            { group: 'Identity', key: 'titleEn', label: 'Name (English)', required: true },
            { group: 'Identity', key: 'titleVn', label: 'Name (Vietnamese)', required: true },
            { group: 'Placement', key: 'tag', label: 'Tag' },
            { group: 'Placement', key: 'partner', label: 'Partner' },
            { group: 'Placement', key: 'priority', label: 'Priority', type: 'number' },
            { group: 'Placement', key: 'linkUrl', label: 'Link URL' },
            { group: 'Validity', key: 'startAt', label: 'Start date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { group: 'Validity', key: 'expiredAt', label: 'Expiry date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { group: 'Content', key: 'contentEn', label: 'Content (English)', type: 'multiline' },
            { group: 'Content', key: 'contentVn', label: 'Content (Vietnamese)', type: 'multiline' },
            { defaultValue: true, group: 'Status', key: 'enabled', label: 'Enabled', type: 'boolean' },
          ],
          imageUpload: { folder: 'advertisement' },
        },
        fields: [
          { format: 'number', label: 'Clicks', paths: ['numberOfClicks'] },
          { format: 'date', label: 'Starts', paths: ['startAt'] },
          { format: 'date', label: 'Expires', paths: ['expiredAt'] },
          { label: 'Tag', paths: ['tag'] },
        ],
        imagePaths: ['image.url', 'image.path'],
        key: 'advertisements',
        label: 'Advertisements',
        searchParam: 'titleEn',
        statusPaths: ['enabled', 'enable'],
        subtitlePaths: ['titleVn', 'contentEn', 'note'],
        titlePaths: ['titleEn', 'titleVn', 'id'],
      },
    ],
    title: 'Advertisements',
  },
  'pop-up-ads': {
    accentColor: marketingAccent,
    description: 'Large-format popup campaigns shown inside the customer app.',
    sections: [
      {
        endpoint: 'api/events',
        editor: {
          entityLabel: 'Popup Ad',
          fields: [
            { group: 'Media', key: 'imageFile', label: 'Popup image', type: 'image' },
            { group: 'Identity', key: 'name', label: 'Name (English)', required: true },
            { group: 'Identity', key: 'nameVn', label: 'Name (Vietnamese)', required: true },
            { group: 'Placement', key: 'linkUrl', label: 'Link URL' },
            { group: 'Validity', key: 'startAt', label: 'Start date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { group: 'Validity', key: 'stopAt', label: 'Stop date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { group: 'Content', key: 'description', label: 'Description (English)', type: 'multiline' },
            { group: 'Content', key: 'descriptionVn', label: 'Description (Vietnamese)', type: 'multiline' },
            { group: 'Content', key: 'content', label: 'Content (English)', type: 'multiline' },
            { group: 'Content', key: 'contentVn', label: 'Content (Vietnamese)', type: 'multiline' },
            { defaultValue: true, group: 'Status', key: 'enabled', label: 'Enabled', type: 'boolean' },
            { defaultValue: true, group: 'Status', key: 'visible', label: 'Visible in app', type: 'boolean' },
          ],
          imageUpload: { folder: 'event' },
        },
        fields: [
          { format: 'date', label: 'Starts', paths: ['startAt'] },
          { format: 'date', label: 'Stops', paths: ['stopAt'] },
          { label: 'Link', paths: ['linkUrl'] },
        ],
        imagePaths: ['image.url', 'image.path'],
        key: 'popups',
        label: 'Popup Ads',
        searchParam: 'name',
        statusPaths: ['enabled', 'visible'],
        subtitlePaths: ['nameVn', 'description', 'content'],
        titlePaths: ['name', 'id'],
      },
    ],
    title: 'Popup Ads',
  },
  subscriptions: {
    accentColor: marketingAccent,
    action: { href: '/marketing/package-list', label: 'Packages' },
    description: 'Subscription packages, benefit events, and customer history.',
    sections: [
      {
        endpoint: 'api/subscription_packages',
        editor: {
          entityLabel: 'Subscription Package',
          updateMethod: 'PUT',
          fields: [
            { group: 'Identity', key: 'name', label: 'Name (English)', required: true },
            { group: 'Identity', key: 'nameVn', label: 'Name (Vietnamese)', required: true },
            { group: 'Pricing', key: 'price', label: 'Price', required: true, type: 'currency' },
            { group: 'Pricing', key: 'discount', label: 'Discount percent', required: true, type: 'number' },
            { group: 'Package rules', key: 'days', label: 'Valid days', required: true, type: 'number' },
            { group: 'Package rules', key: 'wattageConsumed', label: 'Included energy (W)', type: 'number' },
            {
              defaultValue: 0,
              group: 'Eligibility',
              key: 'vehicleType',
              label: 'Vehicle type',
              options: [
                { label: 'All', value: 0 },
                { label: 'Car', value: 'car' },
                { label: 'Bike', value: 'bike' },
              ],
              type: 'select',
            },
            {
              group: 'Eligibility',
              key: 'userLevel',
              label: 'User level',
              lookup: { endpoint: 'api/user_levels', labelPaths: ['name'], params: { pagination: false }, valuePaths: ['iriId', '@id'] },
              type: 'select',
            },
            { group: 'Content', key: 'description', label: 'Description (English)', type: 'multiline' },
            { group: 'Content', key: 'descriptionVn', label: 'Description (Vietnamese)', type: 'multiline' },
            { defaultValue: false, group: 'Status', key: 'enabled', label: 'Enabled', type: 'boolean' },
          ],
        },
        fields: [
          { format: 'currency', label: 'Price', paths: ['price'] },
          { format: 'number', label: 'Days', paths: ['days'] },
          { format: 'energy', label: 'Energy', paths: ['wattageConsumed'] },
          { label: 'Vehicle', paths: ['vehicleType'] },
        ],
        key: 'packages',
        label: 'Packages',
        searchParam: 'name',
        statusPaths: ['enabled'],
        subtitlePaths: ['nameVn', 'description'],
        titlePaths: ['name', 'id'],
      },
      {
        endpoint: 'api/subscription_events',
        editor: {
          entityLabel: 'Subscription Event',
          updateMethod: 'PUT',
          fields: [
            { group: 'Event', key: 'eventName', label: 'Event name', required: true },
            { group: 'Event', key: 'eventCode', label: 'Event code' },
            { group: 'Reward', key: 'value', label: 'Value', required: true, type: 'number' },
            { group: 'Limits', key: 'totalUsage', label: 'Total usage', required: true, type: 'number' },
            { defaultValue: 1, group: 'Limits', key: 'limitation', label: 'Limitation', required: true, type: 'number' },
            {
              group: 'Package',
              key: 'subscriptionPackage',
              label: 'Subscription package',
              lookup: { endpoint: 'api/subscription_packages', labelPaths: ['name', 'nameVn'], params: { pagination: false }, valuePaths: ['iriId', '@id'] },
              required: true,
              type: 'select',
            },
            { group: 'Validity', key: 'startAt', label: 'Start date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { group: 'Validity', key: 'stopAt', label: 'Stop date', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
            { defaultValue: false, group: 'Renewal', key: 'fullTimeRenew', label: 'Full-time renewal', type: 'boolean' },
            { defaultValue: false, group: 'Status', key: 'enabled', label: 'Enabled', type: 'boolean' },
            { defaultValue: false, group: 'Status', key: 'visible', label: 'Visible', type: 'boolean' },
          ],
        },
        fields: [
          { format: 'number', label: 'Value', paths: ['value'] },
          { format: 'number', label: 'Usage', paths: ['totalUsage'] },
          { format: 'date', label: 'Starts', paths: ['startAt'] },
          { format: 'date', label: 'Stops', paths: ['stopAt'] },
        ],
        key: 'events',
        label: 'Events',
        searchParam: 'eventName',
        statusPaths: ['enabled', 'visible'],
        subtitlePaths: ['subscriptionPackage.name', 'eventCode'],
        titlePaths: ['eventName', 'eventCode', 'id'],
      },
      {
        endpoint: 'api/subscription_histories',
        fields: [
          { format: 'currency', label: 'Paid', paths: ['paid', 'originalPrice'] },
          { format: 'number', label: 'Days', paths: ['originalDays', 'extendDays'] },
          { format: 'date', label: 'Ends', paths: ['endDate'] },
          { format: 'boolean', label: 'Auto renew', paths: ['autoRenew'] },
        ],
        key: 'histories',
        label: 'History',
        searchParam: 'user.phoneNumber',
        statusPaths: ['deletedAt'],
        subtitlePaths: ['user.phoneNumber', 'subscriptionPackage.name'],
        titlePaths: ['user.name', 'user.fullName', 'subscriptionPackage.name', 'id'],
      },
    ],
    title: 'Subscriptions',
  },
} satisfies Record<string, CmsPageConfig>;

export type CmsPageKey = keyof typeof cmsPageConfigs;
