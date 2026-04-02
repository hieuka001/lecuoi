# Hướng dẫn đồng bộ Google Sheet (Guestbook + RSVP)

Thiệp gửi dữ liệu lên **Google Apps Script Web App**. Script ghi vào hai tab **Guestbook** và **RSVP** trong cùng một Google Sheet.

---

## 1. Chuẩn bị Google Sheet

1. Tạo **Google Sheet** mới (hoặc dùng file có sẵn).
2. Tạo hai sheet (tab) đặt đúng tên:
   - **`Guestbook`**
   - **`RSVP`**
3. Không bắt buộc tạo sẵn dòng tiêu đề: Apps Script sẽ tự thêm hàng đầu (`submittedAt`, `name`, `message` / `guests`) nếu sheet trống.

---

## 2. Gắn Apps Script vào Sheet

1. Trong Google Sheet: **Extensions** → **Apps Script**.
2. Xóa code mặc định, dán toàn bộ nội dung file **`google-apps-script.gs`** trong project thiệp.
3. **Lưu** (Ctrl+S), đặt tên project tùy ý.

### Token (tùy chọn)

- Trong `google-apps-script.gs`, có thể đặt `const TOKEN = 'mật_khẩu_nội_bộ';`
- Trong `sheet-content.js`, đặt cùng giá trị cho `token: "mật_khẩu_nội_bộ"`
- Nếu để trống cả hai, không kiểm tra token.

---

## 3. Triển khai Web App (bước quan trọng nhất)

1. Trong trình soạn Apps Script: nút **Deploy** → **New deployment**.
2. Loại: **Web app** (biểu tượng bánh răng nếu có chọn type).
3. Cấu hình:
   - **Execute as**: *Me* (tài khoản của bạn).
   - **Who has access**: **Anyone** (bất kỳ ai, kể cả ẩn danh).  
     Nếu chọn *Only myself*, trình duyệt khách sẽ không POST được → thiệp báo lỗi / chờ đồng bộ mãi.
4. **Deploy**, chấp nhận quyền khi Google hỏi.
5. Copy **URL** dạng `https://script.google.com/macros/s/.../exec` (phải là **`/exec`**, không dùng nhầm URL chỉnh sửa script).

Mỗi lần **sửa code** trong Apps Script, cần **Deploy** → **Manage deployments** → biểu tượng bút (Edit) → **Version: New version** → **Deploy**. Nếu không deploy lại, thiệp vẫn gọi bản cũ.

---

## 4. Gắn URL vào thiệp

1. Mở **`sheet-content.js`** trong project.
2. Dán URL vào:

```js
window.WEDDING_SHEET = {
  webhookUrl: "https://script.google.com/macros/s/XXXX/exec",
  token: "" // hoặc cùng TOKEN với Apps Script
};
```

3. Đưa thiệp lên hosting / mở file `index.html` qua HTTP(S) nếu bạn test tính năng đầy đủ (một số trình duyệt hạn chế `fetch` khi mở file trực tiếp `file://` — nên dùng Live Server hoặc host tĩnh).

---

## 5. Kiểm tra nhanh bằng nút **Test webhook**

Ở góc dưới bên trái thiệp có:

- **Badge trạng thái** (xanh / cam / đỏ).
- Nút **Test webhook**.

**Cách dùng:** bấm **Test webhook** một lần. Script sẽ:

1. POST một dòng **Guestbook** (tên `Webhook Test`, nội dung có timestamp).
2. POST một dòng **RSVP** (tên `Webhook Test · RSVP`, `guests: 1`).

Nếu thành công: badge xanh, toast báo đã ghi 2 dòng — mở Sheet, kiểm tra hai tab tương ứng.  
Nếu thất bại: badge đỏ, mở **DevTools** (F12) → tab **Network**, tìm request tới `script.google.com`, xem status và response.

**Mở URL `/exec` trên trình duyệt (GET):**  
Server trả JSON dạng `{"ok":true,"message":"webapp_alive",...}` — chứng tỏ Web App đang chạy (không báo lỗi “missing doGet”).

---

## 6. Ý nghĩa màu badge

| Trạng thái (gợi ý) | Ý nghĩa |
|--------------------|--------|
| Xanh (`ok`)        | Cấu hình có URL; gửi gần đây thành công hoặc test OK. |
| Cam (`warn`)       | Đang đồng bộ hoặc còn mục trong hàng đợi cục bộ. |
| Đỏ (`err`)         | Chưa có `webhookUrl` hoặc test / gửi lỗi. |

---

## 7. Hàng đợi cục bộ (`localStorage`)

Khi mạng lỗi hoặc server không phản hồi `ok`, thiệp lưu payload vào **`localStorage`** với key **`wedding_sheet_queue`** và sẽ thử gửi lại định kỳ.

- Nếu dữ liệu “kẹt” sai hoặc muốn xóa hàng đợi: DevTools → **Application** → **Local Storage** → xóa key `wedding_sheet_queue` (hoặc xóa toàn bộ storage của origin đó).

---

## 8. Gỡ lỗi trên Apps Script

1. Trong Apps Script: **Executions** (hoặc **View** → **Executions**) để xem lần chạy `doPost` / lỗi.
2. Dùng **Logs** (`Logger` / `console.log` trong runtime V8) khi cần.

Thường gặp:

- **401 / invalid_token**: `TOKEN` không khớp giữa Sheet và `sheet-content.js`.
- **`SyntaxError: Unexpected token 'p', "payload=..." is not valid JSON`**: Web App cũ đang `JSON.parse` cả chuỗi form (`payload=...&type=...`). **Sửa** bằng cách copy lại toàn bộ `google-apps-script.gs` mới trong Apps Script → **Deploy** → **Manage deployments** → **New version** → **Deploy**. Thiệp (`script.js`) chỉ POST một field `payload=` để khớp script mới.
- **Không có dòng mới**: chưa deploy lại sau khi sửa script; hoặc Web App không phải **Anyone**; hoặc sai Spreadsheet (script phải “thuộc” đúng file Sheet bạn đang xem — mở Script từ menu **Extensions** của Sheet đó).

---

## 9. File liên quan trong project

| File | Vai trò |
|------|--------|
| `sheet-content.js` | `webhookUrl`, `token` |
| `script.js` | `sendToSheet`, hàng đợi, nút Test webhook, badge |
| `google-apps-script.gs` | `doPost` / `doGet`, ghi Sheet |
| `index.html` | Thanh đồng bộ + nút Test webhook |

Sau khi mọi thứ ổn, bạn có thể ẩn nút Test webhook bằng CSS (ví dụ `.sync-test-btn { display: none }`) nếu không muốn khách bấm nhầm — hoặc giữ lại để tự kiểm tra trước ngày cưới.
