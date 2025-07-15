import { ocr_service } from "@/assets/data/url";

export const getOcrResult = async (arraybuffer: ArrayBuffer) => {
    const formdata = new FormData();
    formdata.append("file", new Blob([arraybuffer]), "image.jpeg");
    return await fetch(ocr_service, {
        method: "POST",
        body: formdata,
    }).then((res) => {
        return res.json();
    }).then((res) => {
        return res.results;
    });
};
