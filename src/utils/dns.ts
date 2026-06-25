/**
 * YemenDNS Base32 Encoder & DNS Query Generator
 * For real, high-efficiency data packet tunneling via authoritative DNS lookups.
 */

// RFC 4648 Base32 Alphabet
const ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";

/**
 * Encodes a string into standard, DNS-label compatible Base32 (no padding, lowercase)
 */
export function encodeBase32(str: string): string {
  // Convert UTF-8 string to byte array
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  let bits = 0;
  let value = 0;
  let output = "";
  
  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i];
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }
  
  return output;
}

/**
 * Splits a message into small chunks, encodes them as Base32,
 * and executes dynamic DNS lookup triggers for YemenDNS Tunneling.
 */
export function triggerDnsTunnel(
  senderEmail: string,
  receiverEmail: string,
  content: string,
  onLog?: (log: { domain: string; type: string; bytes: number; info: string }) => void
): { success: boolean; packets: number; messageId: string } {
  const messageId = Math.random().toString(36).substring(2, 8); // unique 6-char local ID
  const payload = JSON.stringify({
    s: senderEmail,
    r: receiverEmail,
    c: content,
  });

  const b32Encoded = encodeBase32(payload);
  
  // DNS subdomain labels can be up to 63 chars. We chunk the Base32 payload into 45-character labels.
  const labelSize = 45;
  const numChunks = Math.ceil(b32Encoded.length / labelSize);
  
  // We trigger queries for each chunk to yemendns.zapto.org
  for (let idx = 0; idx < numChunks; idx++) {
    const chunk = b32Encoded.substring(idx * labelSize, (idx + 1) * labelSize);
    
    // Subdomain structure: [chunk].[idx].[total_chunks].[messageId].yemendns.zapto.org
    const subdomain = `${chunk}.${idx}.${numChunks}.${messageId}.yemendns.zapto.org`;
    
    // 1. Trigger DNS Lookup via dynamic <link rel="dns-prefetch">
    // This forces the operating system (e.g. Android Webview) to query the cell tower DNS
    try {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = `//${subdomain}`;
      document.head.appendChild(link);
      
      // Clean up DOM after a while
      setTimeout(() => {
        document.head.removeChild(link);
      }, 5000);
    } catch (e) {
      console.error("Failed to append prefetch link", e);
    }

    // 2. Trigger DNS Lookup via dynamic Image request
    // This is double security to force cellular network DNS resolution
    try {
      const img = new Image();
      img.onerror = () => {
        // Silently catch resource load error as DNS resolution was already done by the browser
      };
      // We append a standard fallback port/path. Under cellular "No active subscription" mode,
      // the network blocks the TCP connections, but resolved DNS packets STILL pass perfectly.
      img.src = `http://${subdomain}/ping.png?t=${Date.now()}`;
    } catch (e) {
      console.error("Failed to load DNS pixel image", e);
    }

    // Log the packet in our visual console
    if (onLog) {
      onLog({
        domain: subdomain,
        type: "TXT",
        bytes: chunk.length,
        info: `حزمة ${idx + 1} من ${numChunks} - جاري البث النطاقي عبر الـ DNS...`,
      });
    }
  }

  return {
    success: true,
    packets: numChunks,
    messageId,
  };
}
