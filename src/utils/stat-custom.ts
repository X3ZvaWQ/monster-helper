import { cloneDeep } from "lodash";

const CUSTOM_VALUE_TYPES: CustomStatValueType[] = ["boolean", "number", "string"];

type CustomColumnState = {
    columns: StatSetting[];
    hiddenCustomColumns?: CustomStatSetting[];
    deletedCustomColumns?: CustomStatSetting[];
};

export const normalizeCustomValueType = (valueType: CustomStatValueType | "text" | null | undefined) => {
    if (valueType === "text") return "string";
    return CUSTOM_VALUE_TYPES.includes(valueType as CustomStatValueType) ? (valueType as CustomStatValueType) : "string";
};

export const normalizeCustomValue = (
    value: unknown,
    valueType: CustomStatValueType | "text" | null | undefined,
    fallback?: CustomStatValue
): CustomStatValue => {
    const normalizedType = normalizeCustomValueType(valueType);

    if (normalizedType === "boolean") {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") return ["true", "1", "yes", "y", "是"].includes(value.trim().toLowerCase());
        return typeof fallback === "boolean" ? fallback : false;
    }

    if (normalizedType === "number") {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string" && value.trim() !== "") {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) return parsed;
        }
        return typeof fallback === "number" ? fallback : 0;
    }

    if (value === null || value === undefined) {
        return typeof fallback === "string" ? fallback : "";
    }
    return String(value);
};

export const normalizeCustomColumn = (
    column: Omit<Partial<CustomStatSetting>, "key" | "valueType" | "default"> & {
        key?: string | null;
        valueType?: CustomStatValueType | "text" | null;
        default?: unknown;
    }
) => {
    const valueType = normalizeCustomValueType(column.valueType);
    return {
        ...column,
        type: "custom" as const,
        label: column.label || "自定义列",
        refresh: Boolean(column.refresh),
        valueType,
        default: normalizeCustomValue(column.default, valueType),
    } as CustomStatSetting;
};

export const getCustomCellKey = (column: Pick<CustomStatSetting, "key">) => `custom-${column.key}` as const;

export const getCustomDefaultValue = (column: CustomStatSetting) => {
    return normalizeCustomValue(column.default, column.valueType);
};

export const getCustomRoleValue = (role: Role, column: CustomStatSetting) => {
    const fallback = getCustomDefaultValue(column);
    return normalizeCustomValue(role.customValue?.[column.key], column.valueType, fallback);
};

export const setCustomRoleValue = (role: Role, column: CustomStatSetting, value: unknown) => {
    if (!role.customValue) role.customValue = {};
    role.customValue[column.key] = normalizeCustomValue(value, column.valueType, getCustomDefaultValue(column));
};

export const migrateCustomColumnValues = (roles: Role[], column: CustomStatSetting) => {
    for (const role of roles) {
        setCustomRoleValue(role, column, role.customValue?.[column.key]);
    }
};

export const deleteCustomColumnValues = (roles: Role[], key: string) => {
    for (const role of roles) {
        if (role.customValue) {
            delete role.customValue[key];
        }
    }
};

export const hideCustomColumn = (stat: CustomColumnState, column: CustomStatSetting) => {
    const normalizedColumn = normalizeCustomColumn(column);
    stat.columns = stat.columns.filter((item) => !(item.type === "custom" && item.key === normalizedColumn.key));
    stat.hiddenCustomColumns = stat.hiddenCustomColumns || [];
    if (!stat.hiddenCustomColumns.some((item) => item.key === normalizedColumn.key)) {
        stat.hiddenCustomColumns.unshift(cloneDeep(normalizedColumn));
    }
};

export const showCustomColumn = (stat: CustomColumnState, key: string) => {
    stat.hiddenCustomColumns = stat.hiddenCustomColumns || [];
    const column = stat.hiddenCustomColumns.find((item) => item.key === key);
    if (!column) return;
    stat.hiddenCustomColumns = stat.hiddenCustomColumns.filter((item) => item.key !== key);
    if (!stat.columns.some((item) => item.type === "custom" && item.key === key)) {
        stat.columns.unshift(cloneDeep(normalizeCustomColumn(column)));
    }
};

export const softDeleteCustomColumn = (stat: CustomColumnState, column: CustomStatSetting) => {
    const normalizedColumn = normalizeCustomColumn(column);
    stat.columns = stat.columns.filter((item) => !(item.type === "custom" && item.key === normalizedColumn.key));
    stat.hiddenCustomColumns = (stat.hiddenCustomColumns || []).filter((item) => item.key !== normalizedColumn.key);
    stat.deletedCustomColumns = stat.deletedCustomColumns || [];
    if (!stat.deletedCustomColumns.some((item) => item.key === normalizedColumn.key)) {
        stat.deletedCustomColumns.unshift(cloneDeep(normalizedColumn));
    }
};

export const restoreCustomColumn = (stat: CustomColumnState, key: string) => {
    stat.deletedCustomColumns = stat.deletedCustomColumns || [];
    const column = stat.deletedCustomColumns.find((item) => item.key === key);
    if (!column) return;
    stat.deletedCustomColumns = stat.deletedCustomColumns.filter((item) => item.key !== key);
    stat.hiddenCustomColumns = stat.hiddenCustomColumns || [];
    if (!stat.hiddenCustomColumns.some((item) => item.key === key)) {
        stat.hiddenCustomColumns.unshift(cloneDeep(normalizeCustomColumn(column)));
    }
};

export const purgeCustomColumn = (
    stat: CustomColumnState,
    roles: Role[],
    key: string
) => {
    stat.columns = stat.columns.filter((item) => !(item.type === "custom" && item.key === key));
    stat.hiddenCustomColumns = (stat.hiddenCustomColumns || []).filter((item) => item.key !== key);
    stat.deletedCustomColumns = (stat.deletedCustomColumns || []).filter((item) => item.key !== key);
    deleteCustomColumnValues(roles, key);
};
