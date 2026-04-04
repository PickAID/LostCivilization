import type { FooterConfig } from '../../../utils/content/footer';
import { createIconConfig, createLinkConfig, createGroupConfig } from '../../../utils/content/footer';

export const footerConfig: FooterConfig = {
    beian: {
        showIcon: false,
        icp: {
            icon: createIconConfig(
                'fluent:globe-shield-48-filled',
                'rgba(20, 150, 255, 1)',
                'rgba(100, 200, 255, 1)'
            ),
            number: 'ICP Registration No. 12345678',
            rel: 'noopener noreferrer',
        },
        police: {
            icon: createIconConfig(
                'fluent:shield-checkmark-48-filled',
                'rgba(50, 200, 50, 1)',
                'rgba(100, 255, 100, 1)'
            ),
            number: 'Public Security Registration No. 12345678',
            rel: 'noopener noreferrer',
        },
    },
    author: {
        icon: createIconConfig('mdi:copyright', '#999', '#ccc'),
        name: 'Lost Civilization',
        link: '/',
        rel: 'noopener noreferrer',
        text: 'Documentation surfaces.',
    },
    group: [
        createGroupConfig(
            'Project',
            [
                createLinkConfig(
                    'Developing',
                    '/en-US/Developing/Catalogue',
                    'mdi:cog-outline',
                    {
                        iconColors: { 
                            light: 'rgba(34, 87, 122, 1)',
                            dark: 'rgba(145, 205, 255, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'Grouping',
                    '/en-US/Grouping/Catalogue',
                    'mdi:shape-outline',
                    {
                        iconColors: { 
                            light: 'rgba(142, 96, 47, 1)',
                            dark: 'rgba(247, 203, 150, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'Modpacking',
                    '/en-US/Modpacking/Catalogue',
                    'mdi:package-variant-closed',
                    {
                        iconColors: { 
                            light: 'rgba(160, 105, 44, 1)',
                            dark: 'rgba(255, 205, 142, 1)'
                        },
                    }
                ),
            ],
            'mdi:map-outline',
            { 
                light: 'rgba(173, 94, 40, 1)',
                dark: 'rgba(255, 170, 109, 1)'
            }
        ),
        createGroupConfig(
            'Custom Mod',
            [
                createLinkConfig(
                    'Modding Development',
                    '/en-US/ModdingDeveloping/Catalogue',
                    'mdi:puzzle-outline',
                    {
                        iconColors: { 
                            light: 'rgba(64, 88, 128, 1)',
                            dark: 'rgba(162, 194, 255, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'Design',
                    '/en-US/Design/Catalogue',
                    'mdi:compass-outline',
                    {
                        iconColors: { 
                            light: 'rgba(160, 105, 44, 1)',
                            dark: 'rgba(255, 205, 142, 1)'
                        },
                    }
                ),
            ],
            'mdi:atom-variant',
            { 
                light: 'rgba(74, 101, 146, 1)',
                dark: 'rgba(176, 206, 255, 1)'
            }
        ),
        createGroupConfig(
            'Workflow',
            [
                createLinkConfig(
                    'Contribute',
                    '/en-US/Contribute/Catalogue',
                    'mdi:account-group-outline',
                    {
                        iconColors: { 
                            light: 'rgba(71, 129, 84, 1)',
                            dark: 'rgba(157, 230, 173, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'Changelog',
                    '/en-US/Changelog/',
                    'mdi:timeline-text-outline',
                    {
                        iconColors: { 
                            light: 'rgba(137, 86, 151, 1)',
                            dark: 'rgba(226, 171, 242, 1)'
                        },
                    }
                ),
            ],
            'mdi:hammer-wrench',
            { 
                light: 'rgba(80, 125, 74, 1)',
                dark: 'rgba(170, 224, 164, 1)'
            }
        ),
    ],
};

export default footerConfig; 
