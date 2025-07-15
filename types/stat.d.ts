interface BaseStatSetting {
    type: "basic" | "skill";
    width?: number | string;
    fixed?: "left" | "right";
    style?: {
        color?: string;
        fontSize?: string;
        fontWeight?: string;
    };
}

interface BasicStatSetting extends BaseStatSetting {
    type: "basic";
    label: string;
    key: string;
}

interface BasicRoleStatSetting extends BaseStatSetting {
    type: "basic";
    key: "role";
    label: string;
    withSchoolIcon: boolean;
}

interface SkillStatSetting extends BaseStatSetting {
    type: "skill";
    skillId: number;
    withIcon?: boolean;
    withLabel?: boolean;
    label?: string;
    level?: "number" | "levelLabel";
}

type StatSetting = BasicStatSetting | BasicRoleStatSetting | SkillStatSetting;
