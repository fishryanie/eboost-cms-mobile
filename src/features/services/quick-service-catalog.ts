export type QuickServiceIconName =
  | 'badgeDollarSign'
  | 'badgeInfo'
  | 'cable'
  | 'circleMinus'
  | 'circlePlus'
  | 'gauge'
  | 'lockOpen'
  | 'pencilLine'
  | 'qrCode'
  | 'rotateCcw'
  | 'wrench'
  | 'zap';

export type QuickServiceItem = {
  icon: QuickServiceIconName;
  labelLines: [string, string];
  name: string;
  slug: string;
};

export type QuickServiceGroup = {
  name: string;
  services: QuickServiceItem[];
  slug: string;
};

export const quickServiceGroups: QuickServiceGroup[] = [
  {
    name: 'Charger Services',
    services: [
      {
        icon: 'zap',
        labelLines: ['Trigger', ''],
        name: 'Trigger Charger',
        slug: 'trigger-charger',
      },
      { icon: 'rotateCcw', labelLines: ['Reset', ''], name: 'Reset', slug: 'reset' },
      { icon: 'circleMinus', labelLines: ['Uninstall', ''], name: 'Uninstall Charger', slug: 'uninstall-charger' },
      { icon: 'wrench', labelLines: ['Reinstall', ''], name: 'Reinstall Charger', slug: 'reinstall-charger' },
      { icon: 'lockOpen', labelLines: ['Unlock', ''], name: 'Unlock Charger', slug: 'unlock-charger' },
      {
        icon: 'gauge',
        labelLines: ['Replace', 'Meter'],
        name: 'Replace Meter',
        slug: 'replace-meter',
      },
      {
        icon: 'cable',
        labelLines: ['Replace', 'Charger'],
        name: 'Replace Charger',
        slug: 'replace-charger',
      },
      {
        icon: 'circlePlus',
        labelLines: ['Add', 'Charger'],
        name: 'Add Charger',
        slug: 'add-charger',
      },
      {
        icon: 'qrCode',
        labelLines: ['Download', 'QR Code'],
        name: 'Download QR Code',
        slug: 'download-qr-code',
      },

      {
        icon: 'pencilLine',
        labelLines: ['Edit Charger', 'Info'],
        name: 'Edit Charger Information',
        slug: 'edit-charger-information',
      },
      {
        icon: 'badgeDollarSign',
        labelLines: ['Change', 'Price'],
        name: 'Change Charger Price',
        slug: 'change-charger-price',
      },
      {
        icon: 'badgeInfo',
        labelLines: ['View Charger', 'Details'],
        name: 'View Charger Details',
        slug: 'view-charger-details',
      },
    ],
    slug: 'charger-services',
  },
];
