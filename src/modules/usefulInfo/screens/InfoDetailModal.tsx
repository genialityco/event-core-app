import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  useWindowDimensions,
  Animated,
} from "react-native";
import WebView from "react-native-webview";
import { colors, spacing, typography } from "@/src/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InfoItem {
  _id: string;
  title: string;
  title_en?: string;
  category: string;
  icon: string;
  content: string;
  content_en?: string;
  coverImageUrl?: string;
  order: number;
}

interface InfoDetailModalProps {
  visible: boolean;
  item: InfoItem | null;
  categoryConfig: {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
  };
  onClose: () => void;
  localized: (base: string, translated?: string) => string;
}

// ─── HTML Content Renderer ────────────────────────────────────────────────────

const HtmlContent: React.FC<{ html: string }> = ({ html }) => {
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState(100);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, html]);

  const styledHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }
        
        html, body {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          font-size: 16px;
          line-height: 1.9;
          color: #1a1a1a;
          background: transparent;
          padding: 0 4px;
          overflow: hidden;
          text-align: center;
        }
        
        /* Typography */
        p {
          margin-bottom: 16px;
          margin-right: 5px;
          color: #2a2a2a;
          letter-spacing: 0.5px;
          text-align: center;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        h1 { 
          font-size: 28px; 
          font-weight: 800; 
          margin: 24px 0 16px; 
          color: #000;
          line-height: 1.3;
          text-align: center;
        }
        
        h2 { 
          font-size: 22px; 
          font-weight: 700; 
          margin: 20px 0 12px; 
          color: #1a1a1a;
          line-height: 1.4;
          padding-bottom: 8px;
          border-bottom: 2px solid #f0f0f0;
          text-align: center;
        }
        
        h3 { 
          font-size: 18px; 
          font-weight: 700; 
          margin: 16px 0 8px; 
          color: #333;
          line-height: 1.4;
          text-align: center;
        }
        
        h4, h5, h6 {
          font-size: 16px;
          font-weight: 600;
          margin: 12px 0 6px;
          color: #444;
          text-align: center;
        }
        
        /* Lists - CORREGIDO */
        ul, ol { 
          margin: 0 auto 0 auto;
          padding-left: 24px;
          width: fit-content;
          text-align: left;
          list-style-position: outside;
        }
        
        li { 
          margin-bottom: 8px;
          line-height: 1.8;
          color: #2a2a2a;
          text-align: left;
          padding-left: 4px;
          white-space: normal;
          word-break: break-word;
        }
        
        li:last-child {
          margin-bottom: 0;
        }

        /* Evita que el texto dentro del li salte a otra línea */
        li p {
          display: inline;
          margin: 0;
          padding: 0;
          text-align: left;
        }

        /* Por si el editor genera spans, strong, em, etc. dentro de los li */
        li span,
        li strong,
        li em {
          display: inline;
        }
        
        li em {
          font-style: italic;
        }
        
        /* Emphasis */
        strong { 
          font-weight: 900; 
          color: #000;
          font-size: 18px;
        }
        
        em { 
          font-style: italic;
          color: #555;
        }
        
        /* Dividers */
        hr { 
          border: none; 
          border-top: 2px solid #858585; 
          margin: 20px 0;
        }
        
        /* Images - Better Distribution */
        img { 
          width: 100%;
          height: auto;
          max-height: 400px;
          object-fit: contain;
          border-radius: 12px;
          margin: 30px 0;
          display: block;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }
        
        /* Inline images within text */
        p > img {
          margin: 12px 0;
        }
        
        /* Side-by-side layout for multiple images */
        .image-grid {
          display: flex;
          gap: 12px;
          margin: 16px 0;
          flex-wrap: wrap;
        }
        
        .image-grid img {
          width: 100%;
          height: auto;
          max-height: 400px;
          object-fit: contain;
          margin: 0;
        }
        
        /* Links */
        a { 
          color: #3B82F6; 
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid rgba(59, 130, 246, 0.3);
          transition: all 0.2s ease;
        }
        
        a:active {
          opacity: 0.8;
        }
        
        /* Code blocks */
        code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #d63384;
        }
        
        pre {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
          border-left: 4px solid #3B82F6;
        }
        
        pre code {
          background: none;
          padding: 0;
          color: #1a1a1a;
        }
        
        /* Blockquotes */
        blockquote {
          border-left: 4px solid #3B82F6;
          padding-left: 16px;
          margin: 16px 0;
          color: #555;
          font-style: italic;
          background: rgba(59, 130, 246, 0.05);
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
          max-width: 100%;
          text-align: center;
        }
        
        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        th, td {
          padding: 12px;
          text-align: center;
          border-bottom: 1px solid #e8e8e8;
        }
        
        th {
          background: #f8f9fa;
          font-weight: 700;
          color: #1a1a1a;
          text-align: center;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        /* Special containers */
        .info-box, .alert, .note, .tip, .warning {
          margin: 16px 0;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid;
          max-width: 100%;
          text-align: center;
        }
        
        .info-box {
          background: rgba(59, 130, 246, 0.08);
          border-left-color: #3B82F6;
        }
        
        .note {
          background: rgba(34, 197, 94, 0.08);
          border-left-color: #22c55e;
        }
        
        .tip {
          background: rgba(59, 130, 246, 0.08);
          border-left-color: #3B82F6;
        }
        
        .warning {
          background: rgba(245, 158, 11, 0.08);
          border-left-color: #f59e0b;
        }
        
        .alert {
          background: rgba(239, 68, 68, 0.08);
          border-left-color: #ef4444;
        }
        
        /* Section spacing */
        section {
          margin: 20px 0;
        }
        
        /* Optimized image sizing for content flow */
        img + p, img + h1, img + h2, img + h3 {
          margin-top: 12px;
        }
        
        p + img {
          margin-top: 16px;
        }
        
        /* Better paragraph spacing */
        p + p {
          margin-top: 12px;
        }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `;

  const measureScript = `
    (function() {
      function sendHeight() {
        var height = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight
        );
        window.ReactNativeWebView.postMessage(String(height + 40));
      }
      
      setTimeout(sendHeight, 100);
      
      var images = document.getElementsByTagName('img');
      var pending = images.length;
      
      if (pending === 0) {
        sendHeight();
      } else {
        function onLoad() { 
          pending--; 
          if (pending <= 0) {
            setTimeout(sendHeight, 100);
          }
        }

        for (var i = 0; i < images.length; i++) {
          if (images[i].complete) { 
            onLoad(); 
          } else { 
            images[i].addEventListener('load', onLoad);
            images[i].addEventListener('error', onLoad);
          }
        }
      }
      
      window.addEventListener('load', sendHeight);
      
      var observer = new MutationObserver(sendHeight);
      observer.observe(document.body, { childList: true, subtree: true });
    })();
    true;
  `;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <WebView
        source={{ html: styledHtml }}
        style={{ width: width - spacing.md * 2, height }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={["*"]}
        onMessage={(e) => {
          const newHeight = Number(e.nativeEvent.data);

          if (!Number.isNaN(newHeight) && newHeight > 0) {
            setHeight(newHeight);
          }
        }}
        injectedJavaScript={measureScript}
      />
    </Animated.View>
  );
};

// ─── Info Detail Modal ────────────────────────────────────────────────────────

export const InfoDetailModal: React.FC<InfoDetailModalProps> = ({
  visible,
  item,
  categoryConfig,
  onClose,
  localized,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {item && (
        <View style={styles.modal}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.modalHeaderContent}>
              <Text
                style={[
                  styles.modalHeaderIcon,
                  {
                    color: categoryConfig.color,
                  },
                ]}
              >
                {categoryConfig.icon}
              </Text>

              <Text style={styles.modalHeaderTitle} numberOfLines={2}>
                {localized(item.title, item.title_en)}
              </Text>
            </View>

            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {item.coverImageUrl ? (
              <Image
                source={{ uri: item.coverImageUrl }}
                style={styles.modalCover}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.modalCoverPlaceholder,
                  {
                    backgroundColor: categoryConfig.bgColor,
                  },
                ]}
              >
                <Text style={styles.modalCoverIcon}>{categoryConfig.icon}</Text>
              </View>
            )}

            <Text
              style={[
                styles.modalTitle,
                {
                  color: categoryConfig.color,
                },
              ]}
            >
              {localized(item.title, item.title_en)}
            </Text>

            <View style={styles.categoryBadgeLarge}>
              <Text
                style={[
                  styles.categoryLabelLarge,
                  {
                    color: categoryConfig.color,
                  },
                ]}
              >
                {categoryConfig.label}
              </Text>
            </View>

            <View style={styles.divider} />

            <HtmlContent html={localized(item.content, item.content_en)} />

            <View style={{ height: spacing.lg }} />
          </ScrollView>
        </View>
      )}
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ─ Modal
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  modalHeaderContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modalHeaderIcon: {
    fontSize: 30,
  },
  modalHeaderTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: "700",
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  closeBtnText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  modalScroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    padding: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  modalCover: {
    width: "100%",
    height: 170,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  modalCoverPlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCoverIcon: {
    fontSize: 64,
  },
  modalTitle: {
    ...typography.h2,
    fontWeight: "700",
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  // ─ Category Badge in Modal
  categoryBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryLabelLarge: {
    ...typography.body2,
    fontWeight: "600",
    fontSize: 12,
  },

  // ─ Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
});
