import type { FormRules } from "element-plus";
/**-----------------------------------特殊校驗方法------------------------------ */

// 身分證校驗
const codeMap: Record<string, number> = {
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
  G: 16,
  H: 17,
  I: 34,
  J: 18,
  K: 19,
  L: 20,
  M: 21,
  N: 22,
  O: 35,
  P: 23,
  Q: 24,
  R: 25,
  S: 26,
  T: 27,
  U: 28,
  V: 29,
  W: 32,
  X: 30,
  Y: 31,
  Z: 33,
};

const checkIdCard = (rule: any, value: string, callback: any) => {
  if (!value) callback(new Error("請輸入身分證字號"));
  if (value) {
    console.log("checkCkDigit", value);

    if (!/^[A-Z][0-9]{9}$/.test(value)) {
      callback({ valid: false, message: "身份證格式不正確" });
    }

    const placeCode = codeMap[value[0]];
    if (!placeCode) {
      callback({ valid: false, message: "首碼無效" });
    }

    const bodyCode = value.substring(1, 9);
    const lastCode = value[9];
    const calHead = (num: number): number =>
      Math.floor(num / 10) * 1 + (num % 10) * 9;
    const calBody = (code: string): number => {
      let sum = 0;
      for (let i = 0; i < code.length; i++) {
        sum += parseInt(code[i]) * (8 - i);
      }
      return sum;
    };
    const idSum =
      calHead(placeCode) + calBody(bodyCode) + parseInt(lastCode) * 1;
    const isValid = idSum % 10 === 0;
    if (!isValid) {
      callback({ valid: false, message: "身分證號不合法" });
    } else {
      callback();
    }
  }
};

/**-----------------------------------中文校驗------------------------------ */
export const formRulesTW = reactive<FormRules>({
  chineseName: [{ required: true, message: "請輸入中文名", trigger: "blur" }],
  firstName: [{ required: true, message: "請輸入英文名", trigger: "blur" }],
  lastName: [{ required: true, message: "請輸入英文姓", trigger: "blur" }],
  email: [
    { required: true, message: "請輸入電子郵件", trigger: "blur" },
    { type: "email", message: "請輸入正確的電子郵件格式", trigger: "blur" },
  ],
  affiliation: [{ required: true, message: "請輸入所屬機構", trigger: "blur" }],
  jobTitle: [{ required: true, message: "請輸入職稱", trigger: "blur" }],
  countryCode: [{ required: true, message: "請輸入國家代碼", trigger: "blur" }],
  country: [{ required: true, message: "請輸入國家", trigger: "blur" }],
  phone: [{ required: true, message: "請輸入電話號碼", trigger: "blur" }],
  idCard: [{ required: true, validator: checkIdCard, trigger: "blur" }],
  // category: [{ required: true, message: "請選擇類別", trigger: "blur" }],
});

/**-----------------------------------英文校驗------------------------------ */
export const formRulesEN = reactive<FormRules>({
  firstName: [
    { required: true, message: "Please input firsrName", trigger: "blur" },
  ],
  lastName: [
    { required: true, message: "Please input lastName", trigger: "blur" },
  ],
  email: [
    { required: true, message: "Please input email", trigger: "blur" },
    { type: "email", message: "Please input correct email", trigger: "blur" },
  ],
  affiliation: [
    { required: true, message: "Please input affiliation", trigger: "blur" },
  ],
  jobTitle: [
    { required: true, message: "Please input jobTitle", trigger: "blur" },
  ],
  countryCode: [
    { required: true, message: "Please input country code", trigger: "blur" },
  ],
  country: [
    { required: true, message: "Please select country", trigger: "blur" },
  ],
  phone: [
    { required: true, message: "Please input phone number", trigger: "blur" },
  ],
  idCard: [
    { required: true, message: "Please input passport code", trigger: "blur" },
  ],
});
