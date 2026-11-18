# GoalVault — กระปุกออมเงินตามเป้าหมาย

โครงงานใหม่ที่ใช้แนวคิด DApp การฝากและถอน มาต่อยอดเป็นการออมหลายเป้าหมายต่อกระเป๋า ไม่ได้คัดลอกระบบธนาคารในตัวอย่าง

## ทดลองใช้งาน

- โหมด **ทดลองใช้งาน** เปิดได้ทันที ไม่มีบัญชี ไม่มีสิทธิ์แอดมิน ไม่ต้องมี MetaMask ยอดตัวอย่างและรายการทั้งหมดเป็นข้อมูลจำลองใน localStorage ของเบราว์เซอร์
- โหมด **Sepolia Testnet** ใช้สัญญาบนบล็อกเชนจริงของเครือข่ายทดสอบ ต้องมี MetaMask และ Sepolia test ETH สำหรับ gas
- ทุกกระเป๋าสร้างเป้าหมาย ฝาก ตรวจยอด และถอนเงินของตนเองได้ ไม่มี owner, allowlist, ค่าธรรมเนียมสัญญา หรือเวลาล็อกเงิน
- ชื่อเป้าหมายและยอดบนบล็อกเชนเป็นข้อมูลสาธารณะ แต่การถอนใช้ `msg.sender` จึงไม่สามารถถอนเงินของกระเป๋าคนอื่นได้
- แถบรายการล่าสุดในโหมด Sepolia แสดงธุรกรรมที่ส่งจากหน้านี้ในรอบการใช้งานนี้ ส่วนยอดและเป้าหมายอ่านจากสัญญาใหม่ทุกครั้งที่กดตรวจยอด

## Deploy ด้วย Remix + MetaMask

1. เปิด https://remix.ethereum.org แล้วสร้างไฟล์ `GoalVault.sol` นำเนื้อหาจาก `contracts/GoalVault.sol` ไปใส่
2. ตั้ง compiler เป็น **0.8.30**, เปิด optimizer **200 runs**, EVM Version **paris** แล้ว Compile
3. เปิด MetaMask เลือก **Sepolia**, Chain ID **11155111** และเตรียม test ETH
4. ใน Remix แท็บ Deploy & Run เลือก environment ที่เชื่อม MetaMask เช่น Injected Provider / Browser Extension แล้วตรวจว่าเป็น Sepolia
5. เลือก GoalVault กด Deploy สัญญาไม่มี constructor arguments และไม่ต้องแนบ ETH ยืนยันค่า gas ใน MetaMask
6. คัดลอก Contract Address เปิดเว็บ GoalVault → ตั้งค่า Contract → วาง Address → ตรวจสอบและใช้ Contract นี้
7. กด “คัดลอกลิงก์พร้อม Contract” เพื่อส่งลิงก์ที่มี `?contract=0x...` ให้อาจารย์ แต่ละคนใช้กระเป๋าตัวเองได้

ทางเลือก: ปุ่ม **Deploy GoalVault ผ่าน MetaMask** บนเว็บใช้ bytecode จาก source เดียวกันที่ compile ตามค่าด้านบน ต้องยืนยันใน MetaMask เช่นกัน

หากต้องการตั้ง Address เริ่มต้นสำหรับทุกคน แก้ `dist/config.json` ช่อง `contractAddress` เป็น Address ที่ deploy สำเร็จแล้ว และเผยแพร่เว็บใหม่

## Etherscan และการ verify source

ธุรกรรมในเว็บมีลิงก์ไป `https://sepolia.etherscan.io/tx/<hash>` และหน้าตั้งค่ามีลิงก์ `/address/<contract>`

การ deploy ไม่เท่ากับการ verify source: หากต้องการให้อาจารย์อ่าน source หรือเรียก Write Contract บน Etherscan ให้ verify เพิ่มผ่าน Contract Verification plugin ใน Remix หรือ Etherscan Verify & Publish โดยใช้:

- Solidity 0.8.30+commit.73712a01
- MIT license
- Standard JSON Input จาก `dist/standard-input.json`
- ชื่อสัญญา `GoalVault.sol:GoalVault`
- Optimizer enabled, 200 runs; EVM Paris; ไม่มี constructor arguments

หาก Remix ขอ Etherscan API key ให้เจ้าของบัญชีใส่ด้วยตัวเอง ไม่ใส่ key ลงใน source หรือเว็บ

## เช็กลิสต์ให้อาจารย์ทดสอบ

1. เปิดเว็บโดยไม่ login ทดลองสร้างเป้าหมาย “ทริป” จำนวน 0.05 ETH ในโหมดสาธิต
2. ฝาก 0.01 ETH ตรวจความคืบหน้า 20% ถอน 0.005 ETH ตรวจยอด 0.005 ETH
3. ทดลองถอนเกินยอดหรือกรอก 0 ต้องแสดงข้อผิดพลาด
4. เปลี่ยนไป Sepolia เชื่อม MetaMask และ Contract ที่ deploy แล้ว ทำรายการซ้ำด้วย test ETH
5. กด Etherscan ตรวจ transaction receipt และเหตุการณ์ GoalCreated / Deposited / Withdrawn
6. สลับไปกระเป๋าใหม่ กดตรวจยอด จะเห็นเป้าหมายของกระเป๋าใหม่ ทุกกระเป๋าสร้างได้โดยไม่ต้องให้ผู้ deploy อนุมัติ
7. ตรวจว่ากระเป๋าใหม่ไม่สามารถถอนยอดของกระเป๋าแรกได้ และการปฏิเสธใน MetaMask ไม่บันทึกรายการว่าสำเร็จ

## รันในเครื่อง

ต้องมี Node.js 20 ขึ้นไป

```sh
npm install
npm run build
npm test
npm start
```

เปิด http://127.0.0.1:4173

เว็บเป็น static HTML/CSS/JavaScript และ bundle ethers ใน `dist/vendor/` ไว้แล้ว สามารถนำเนื้อหาโฟลเดอร์ `dist` ไปวางบน GitHub Pages หรือ static hosting ได้ ไม่มี backend และไม่มี secret ในเว็บ

## เอกสารอ้างอิง

- Ethereum networks: https://ethereum.org/developers/docs/networks/
- Remix Deploy & Run: https://remix-ide.readthedocs.io/en/latest/run.html
- Remix contract verification: https://remix-ide.readthedocs.io/en/latest/contract_verification.html
- MetaMask test ETH: https://support.metamask.io/develop/blockchain-networks/testnets/using-the-testnet-faucet

สัญญานี้จัดทำเพื่อการศึกษาและทดสอบบน Sepolia เท่านั้น
