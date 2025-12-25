import { Button, Space, Grid, theme, Modal } from "antd";
import { EnvironmentOutlined, LoadingOutlined } from "@ant-design/icons";
import { useState } from "react";
import useGeolocation from "./useGeolocation";

const { useBreakpoint } = Grid;

const truncateWords = (s = "", n = 3) => {
  if (!s) return s;
  const words = s.trim().split(/\s+/);
  if (words.length <= n) return s;
  return words.slice(0, n).join(" ") + "...";
};

export default function LocationDisplay() {
  const screens = useBreakpoint();
  const { token } = theme.useToken();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const {
    address,
    loading: locLoading,
    error: locError,
    refetch: refetchLocation
  } = useGeolocation();

  const handleLocationClick = () => {
    if (locError) {
      refetchLocation();
    } else {
      setShowLocationModal(true);
    }
  };

  const handleLocationPermission = () => {
    refetchLocation();
    setShowLocationModal(false);
  };

  if (locLoading) {
    return (
      <Space size={4} align="center">
        <LoadingOutlined spin />
        <span style={{ fontSize: 12, color: token.colorTextSecondary }}>Đang định vị...</span>
      </Space>
    );
  }

  if (locError) {
    return (
      <>
        <Button
          type="link"
          size="small"
          onClick={handleLocationClick}
          style={{
            padding: '0 4px',
            height: 'auto',
            color: '#f5222d',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Space size={4} align="center">
            <EnvironmentOutlined />
            <span>{locError}</span>
          </Space>
        </Button>

        <Modal
          title="Vị trí giao hàng"
          open={showLocationModal}
          onCancel={() => setShowLocationModal(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowLocationModal(false)}>
              Hủy
            </Button>,
            <Button key="allow" type="primary" onClick={handleLocationPermission}>
              Cho phép truy cập vị trí
            </Button>
          ]}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <EnvironmentOutlined style={{ fontSize: 48, color: '#16a34a', marginBottom: 16 }} />
            <p>Để có trải nghiệm tốt nhất, vui lòng cho phép chúng tôi truy cập vị trí của bạn.</p>
            <p style={{ color: token.colorTextSecondary, fontSize: 14 }}>
              Điều này giúp chúng tôi tìm các nhà hàng gần bạn nhất.
            </p>
          </div>
        </Modal>
      </>
    );
  }

  if (address && address.detailed) {
    const displayText = screens.xs ? address.short : address.detailed;
    const displayTextTrunc = truncateWords(displayText, 3);
    const shortTrunc = truncateWords(address.short, 3);
    const maxWidth = screens.xs ? 120 : (screens.lg ? 200 : 150);

    return (
      <>
        <Button
          type="link"
          size="small"
          onClick={handleLocationClick}
          style={{
            padding: '0 4px',
            height: 'auto',
            color: token.colorText,
            maxWidth,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Space size={4} align="center" style={{ width: '100%' }}>
            <EnvironmentOutlined style={{ color: '#16a34a', fontSize: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: 1.2
                }}
                title={address.full}
              >
                {displayTextTrunc}
              </div>
              {!screens.xs && address.short !== address.detailed && (
                <div
                  style={{
                    fontSize: 11,
                    color: token.colorTextTertiary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2
                  }}
                  title={address.full}
                >
                  {shortTrunc}
                </div>
              )}
            </div>
          </Space>
        </Button>

        <Modal
          title="Vị trí giao hàng"
          open={showLocationModal}
          onCancel={() => setShowLocationModal(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowLocationModal(false)}>
              Hủy
            </Button>,
            <Button key="allow" type="primary" onClick={handleLocationPermission}>
              Cho phép truy cập vị trí
            </Button>
          ]}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <EnvironmentOutlined style={{ fontSize: 48, color: '#16a34a', marginBottom: 16 }} />
            <p>Để có trải nghiệm tốt nhất, vui lòng cho phép chúng tôi truy cập vị trí của bạn.</p>
            <p style={{ color: token.colorTextSecondary, fontSize: 14 }}>
              Điều này giúp chúng tôi tìm các nhà hàng gần bạn nhất.
            </p>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <Button
        type="link"
        size="small"
        onClick={handleLocationClick}
        style={{
          padding: '0 4px',
          height: 'auto',
          color: '#1890ff',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Space size={4} align="center">
          <EnvironmentOutlined />
          <span>Chọn địa điểm</span>
        </Space>
      </Button>

      <Modal
        title="Vị trí giao hàng"
        open={showLocationModal}
        onCancel={() => setShowLocationModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowLocationModal(false)}>
            Hủy
          </Button>,
          <Button key="allow" type="primary" onClick={handleLocationPermission}>
            Cho phép truy cập vị trí
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <EnvironmentOutlined style={{ fontSize: 48, color: '#16a34a', marginBottom: 16 }} />
          <p>Để có trải nghiệm tốt nhất, vui lòng cho phép chúng tôi truy cập vị trí của bạn.</p>
          <p style={{ color: token.colorTextSecondary, fontSize: 14 }}>
            Điều này giúp chúng tôi tìm các nhà hàng gần bạn nhất.
          </p>
        </div>
      </Modal>
    </>
  );
}