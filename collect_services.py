import os
import re
import json
import math
import psutil
import win32evtlog

def calculate_entropy(text):
    """Calculates character randomness to spot auto-generated malware names."""
    if not text: return 0
    return round(sum(- (text.count(chr(x))/len(text)) * math.log(text.count(chr(x))/len(text), 2) for x in range(256) if text.count(chr(x)) > 0), 2)

def get_service_timestamps():
    """Queries Windows Event Logs for Event ID 7045 to get exact installation times."""
    timestamps = {}
    try:
        hand = win32evtlog.OpenEventLog('localhost', 'System')
        flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
        while True:
            events = win32evtlog.ReadEventLog(hand, flags, 0)
            if not events: break
            for event in events:
                # 7045 = A service was successfully installed in the system
                if (event.EventID & 0xFFFF) == 7045 and event.StringInserts:
                    service_name = event.StringInserts[0]
                    # Format timestamp cleanly as ISO string for easy React parsing
                    timestamps[service_name] = event.TimeGenerated.isoformat()
    except Exception:
        pass
    return timestamps

def gather_soc_telemetry():
    windows_pattern = re.compile(r"system32|syswow64|Windows\\SystemApps", re.IGNORECASE)
    oem_pattern = re.compile(r"Program Files\\(Dell|HP|Lenovo|ASUS|Acer|Razer|Intel|AMD|Nvidia)", re.IGNORECASE)
    suspicious_paths = re.compile(r"\\Users\\|\\Temp\\|\\AppData\\|\\Downloads\\|\\ProgramData\\", re.IGNORECASE)
    
    log_timestamps = get_service_timestamps()
    service_data = []

    for service in psutil.win_service_iter():
        try:
            info = service.as_dict()
            name = info.get('name', '')
            display_name = info.get('display_name', '')
            status = info.get('status', '')
            start_type = info.get('start_type', '')
            path = info.get('binpath', '') or ''
            
            # 1. Structural 4-Tier Segregation Matching
            if windows_pattern.search(path):
                category = "Windows Core"
            elif oem_pattern.search(path):
                category = "OEM / Hardware Service"
            elif "svchost.exe" in path.lower() or not path:
                category = "Local System Host"
            else:
                category = "Third-Party / Apps"

            # 2. Forensic Logic Rules
            entropy = calculate_entropy(name)
            is_suspicious_path = bool(suspicious_paths.search(path))
            
            # Risk assignment
            if (category == "Third-Party / Apps" and is_suspicious_path) or (entropy > 4.8):
                risk_score = "High"
                mitre_mapping = "T1543.003 (Windows Service Persistence)"
            elif category == "Third-Party / Apps":
                risk_score = "Medium"
                mitre_mapping = "N/A"
            else:
                risk_score = "Low"
                mitre_mapping = "N/A"

            # Fetch explicit timestamp or fall back to system baseline marker
            timestamp = log_timestamps.get(name, "System Baseline")

            service_data.append({
                "name": name,
                "displayName": display_name,
                "category": category,
                "status": status,
                "startType": start_type,
                "path": path if path else "Kernel/Internal Execution",
                "timestamp": timestamp,
                "riskScore": risk_score,
                "mitreMapping": mitre_mapping
            })
        except Exception: 
            continue

    with open("services_telemetry.json", "w", encoding="utf-8") as f:
        json.dump(service_data, f, indent=4)
    print("Successfully generated services_telemetry.json!")

if __name__ == "__main__":
    gather_soc_telemetry()