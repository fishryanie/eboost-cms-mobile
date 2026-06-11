export type QuickServiceItem = {
  icon: string;
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
      { icon: 'bolt.circle', labelLines: ['Trigger', ''], name: 'Trigger Charger', slug: 'trigger-charger' },
      { icon: 'arrow.clockwise', labelLines: ['Reset', ''], name: 'Reset', slug: 'reset' },
      { icon: 'minus.circle', labelLines: ['Uninstall', ''], name: 'Uninstall Charger', slug: 'uninstall-charger' },
      { icon: 'wrench.and.screwdriver', labelLines: ['Reinstall', ''], name: 'Reinstall Charger', slug: 'reinstall-charger' },
      { icon: 'lock.open', labelLines: ['Unlock', ''], name: 'Unlock Charger', slug: 'unlock-charger' },
      {
        icon: 'gauge.with.dots.needle.67percent',
        labelLines: ['Replace', 'Meter'],
        name: 'Replace Meter',
        slug: 'replace-meter',
      },
      {
        icon: 'ev.charger',
        labelLines: ['Replace', 'Charger'],
        name: 'Replace Charger',
        slug: 'replace-charger',
      },
      {
        icon: 'plus.circle',
        labelLines: ['Add', 'Charger'],
        name: 'Add Charger',
        slug: 'add-charger',
      },
      {
        icon: 'qrcode',
        labelLines: ['Download', 'QR Code'],
        name: 'Download QR Code',
        slug: 'download-qr-code',
      },

      {
        icon: 'pencil.line',
        labelLines: ['Edit Charger', 'Info'],
        name: 'Edit Charger Information',
        slug: 'edit-charger-information',
      },
      {
        icon: 'dollarsign.arrow.circlepath',
        labelLines: ['Change', 'Price'],
        name: 'Change Charger Price',
        slug: 'change-charger-price',
      },
      {
        icon: 'info.circle',
        labelLines: ['View Charger', 'Details'],
        name: 'View Charger Details',
        slug: 'view-charger-details',
      },
    ],
    slug: 'charger-services',
  },
];
