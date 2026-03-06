import request from "@/utils/request";
import { Axios, AxiosPromise } from "axios";

export function getAttendeesHistoryExcelTemplateApi(): AxiosPromise {
  return request({
    url: "/attendees-history/excel-template",
    method: "get",
    responseType: "arraybuffer",
  });
}

export function importAttendeesHistoryExcelApi(data: FormData): AxiosPromise {
  return request({
    url: "/attendees-history/import",
    method: "post",
    data,
  });
}

export function getAttendeesHistoryByPaginationApi(page: number, size: number): AxiosPromise {
  return request({
    url: "/attendees-history/pagination",
    method: "get",
    params: {
      page: page,
      size: size,
    },
  });
}
