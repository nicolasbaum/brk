import { BrkClient } from "./modules/brk-client/index.js";

<<<<<<< HEAD
// const brk = new BrkClient("https://bitview.space");
=======
// const brk = new BrkClient("https://next.bitview.space");
>>>>>>> 69eb58f7 (chore: update website from upstream v0.1.5)
const brk = new BrkClient("/");

console.log(`VERSION = ${brk.VERSION}`);

export { brk };
