import os

path = r'c:\Users\TheGoat\Desktop\project\backend\odoo\addons\condome_billing\services\billing_api_service.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '            record.write(self._self_service_payment_values(payload, record.state))\n            return self.build_response({"data": self.serialize_charge(record)})'
replacement = '            p_values = self._self_service_payment_values(payload, record.state)\n            record.action_confirm_payment(method=p_values["payment_method"], reference=p_values["payment_reference"])\n            return self.build_response({"data": self.serialize_charge(record)})'

if target in content:
    new_content = content.replace(target, replacement)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success: Patched instances.")
else:
    print("Error: Target string not found.")
    # Debug: print the first few lines of content around where we expect the match
    start = content.find('def handle_property_owner_payments')
    if start != -1:
        print("Context found at:", start)
        print(content[start:start+1000])
