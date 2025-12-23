// src/pages/ActivatePage.jsx
import React, { useEffect, useState, useRef } from 'react'; // 1. Import useRef
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from 'antd';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../redux/store/store';
import { setAuthMode, setShowAuthModal } from '../../redux/store/slices/userSlice';

export default function ActivatePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const effectRan = useRef(false); 

  const dispatch = useAppDispatch();
  useEffect(() => {
    // 3. Thêm điều kiện kiểm tra ref
    // Trong React.StrictMode, effect sẽ chạy 2 lần.
    // Lần 2 effectRan.current sẽ là true và bỏ qua việc gọi API.
    if (effectRan.current === true) {
      return;
    }

    const activateAccount = async () => {
      if (!token) {
        setStatus('invalid');
        setMessage('Link kích hoạt không hợp lệ hoặc không chứa token.');
        return;
      }

      try {
        const API = process.env.REACT_APP_API_BASE ?? '';
        const url = `${API}/auth/activate?token=${encodeURIComponent(token)}`;
        
        // Khi request thành công (status 2xx), nó sẽ chạy vào đây
        const resp = await axios.get(url, { withCredentials: true, timeout: 15000 });
        
        setStatus('success');
        const successMessage = resp.data?.data?.message || resp.data?.message || 'Kích hoạt tài khoản thành công!';
        setMessage(successMessage);

      } catch (err) {
        // Mọi lỗi (4xx, 5xx, network error) sẽ được bắt ở đây
        console.error('Activation request failed:', err);
        
        if (!err.response) {
            setStatus('error');
            setMessage('Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
            return;
        }

        const errorData = err.response.data;
        const errorStatus = err.response.status;
        const errorMessage = errorData?.message || errorData?.error || 'Có lỗi không xác định xảy ra.';

        if (errorStatus === 410 || String(errorMessage).toLowerCase().includes('expired')) {
            setStatus('expired');
        } else if (errorStatus === 400 || String(errorMessage).toLowerCase().includes('invalid')) {
            setStatus('invalid');
        } else {
            setStatus('error');
        }
        setMessage(errorMessage);
      }
    };

    activateAccount();

    // 4. Đánh dấu là effect đã chạy xong trong cleanup function
    return () => {
      effectRan.current = true;
    };
  }, [token]); // Chỉ phụ thuộc vào token

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: 24 }}>
        {status === 'loading' && <h3>⏳ Đang xác thực tài khoản...</h3>}

        {status === 'success' && (
          <>
            <h2 style={{ color: 'green' }}>✅ Kích hoạt thành công!</h2>
            <p>{message}</p>
             <Button
              type="primary"
              onClick={() => {
                dispatch(setAuthMode('login'));   
                dispatch(setShowAuthModal(true)); 
              }}
            >
              Đăng nhập ngay
            </Button>
          </>
        )}

        {status === 'expired' && (
          <>
            <h2 style={{ color: 'orange' }}>⚠️ Link đã hết hạn</h2>
            <p>{message}</p>
            <Button onClick={() => navigate('/auth/resend')}>Yêu cầu gửi lại link</Button>
          </>
        )}

        {status === 'invalid' && (
          <>
            <h2 style={{ color: 'red' }}>❌ Link không hợp lệ</h2>
            <p>{message}</p>
            <Button onClick={() => navigate('/auth/resend')}>Yêu cầu gửi lại link</Button>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 style={{ color: 'red' }}>❗ Có lỗi xảy ra</h2>
            <p>{message}</p>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </>
        )}
      </div>
    </Layout>
  );
}