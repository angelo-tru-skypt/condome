
import os
import sys

# Mocking enough to run the domain functions
class MockRecordset:
    def __init__(self, ids, apt_ids=None, condo_ids=None):
        self.ids = ids
        self.apt_ids = apt_ids or []
        self.condo_ids = condo_ids or []
    
    def mapped(self, path):
        if path == "apartamento_id":
            return MockRecordset(self.apt_ids)
        if path == "condominio_id":
            return MockRecordset(self.condo_ids)
        return self

def test_domains():
    residents = MockRecordset([1], [10], [100])
    
    # Logic from the file
    apartment_ids = residents.mapped("apartamento_id").ids
    condominio_ids = residents.mapped("condominio_id").ids
    
    domain = [("state", "in", ["pending", "overdue"])]
    domain += ["|", "|"]
    domain += [("residente_id", "in", residents.ids)]
    domain += [("apartamento_id", "in", apartment_ids)]
    domain += ["&", ("apartamento_id", "=", False), ("condominio_id", "in", condominio_ids)]
    
    print(f"Charge Domain: {domain}")
    for item in domain:
        if isinstance(item, str):
            print(f"  Op: {item}")
        else:
            print(f"  Leaf: {item} (len {len(item)})")
            if len(item) != 3:
                print("  ERROR: NOT 3!!")

    domain2 = ["|"]
    domain2 += [("apartamento_id", "in", apartment_ids)]
    domain2 += ["&", ("apartamento_id", "=", False), ("condominio_id", "in", condominio_ids)]
    
    print(f"Template Domain: {domain2}")
    for item in domain2:
        if isinstance(item, str):
            print(f"  Op: {item}")
        else:
            print(f"  Leaf: {item} (len {len(item)})")

if __name__ == "__main__":
    test_domains()
