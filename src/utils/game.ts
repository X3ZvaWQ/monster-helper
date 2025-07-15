import schoolMap from "@jx3box/jx3box-data/data/xf/schoolid.json";

export const getSchoolName = (id: SchoolIds): string => {
    return schoolMap[id] || "未知";
};

export const schoolIconLink = (id: SchoolIds): string => {
    const schoolName = getSchoolName(id);
    return `https://img.jx3box.com/image/school/${schoolName}.png`;
};

export const iconLink = (id: number, category: "default" | "school" = "default"): string => {
    if (category === "school") {
        return schoolIconLink(id as unknown as SchoolIds);
    }
    return `https://icon.jx3box.com/icon/${id}.png`;
};
