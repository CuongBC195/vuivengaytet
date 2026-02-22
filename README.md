# Lô Tô Online 🎱

Web app chơi Lô Tô online realtime, xây dựng với Next.js, TypeScript và Supabase.

## Tính năng

-   **Realtime**: Đồng bộ số ngay lập tức cho tất cả người chơi.
-   **Host**: Người tạo phòng làm chủ, điều khiển quay số.
-   **Âm thanh**: Đọc số tự động (Text-to-Speech).
-   **Responsive**: Chơi tốt trên điện thoại và máy tính.

## Cài đặt và Chạy thử (Local)

1.  **Clone repo & Cài đặt dependencies**:
    ```bash
    npm install
    ```

2.  **Setup Supabase**:
    -   Tạo project mới trên [Supabase](https://supabase.com/).
    -   Vào **SQL Editor**, chạy đoạn script (xem `src/lib/schema.sql`).
    -   Lấy **Project URL** và **Anon Key**.

3.  **Cấu hình biến môi trường**:
    -   Tạo file `.env.local`:
        ```env
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```

4.  **Chạy ứng dụng**:
    ```bash
    npm run dev
    ```

## Deploy lên Vercel

1.  Push code lên GitHub.
2.  Vào [Vercel](https://vercel.com/new), import repo.
3.  Thêm biến môi trường `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4.  Deploy!
