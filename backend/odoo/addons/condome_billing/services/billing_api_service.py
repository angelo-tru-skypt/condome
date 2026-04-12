import logging

from odoo import _
from odoo import fields
from odoo.http import request

from odoo.addons.condome_core.services.base_api_service import BaseApiService

_logger = logging.getLogger(__name__)


class BillingApiService(BaseApiService):
    """Concentra la logica financiera para no mezclarla con estructura ni comunidad."""

    def handle_options(self):
        return self.build_response({"ok": True})

    def serialize_fee_template(self, record):
        return {
            "id": record.id,
            "name": record.name,
            "condominioId": record.condominio_id.id,
            "apartamentoId": record.apartamento_id.id if record.apartamento_id else False,
            "apartamentoNombre": record.apartamento_id.name if record.apartamento_id else "",
            "amount": record.amount,
            "currency": record.currency_id.name,
            "dueDay": record.due_day,
            "frequency": record.frequency,
            "active": record.active,
            "note": record.note or "",
        }

    def serialize_charge(self, record):
        return {
            "id": record.id,
            "name": record.name,
            "condominioId": record.condominio_id.id,
            "apartamentoId": record.apartamento_id.id if record.apartamento_id else False,
            "apartamentoNombre": record.apartamento_id.name if record.apartamento_id else "",
            "propietarioId": record.propietario_id.id if record.propietario_id else False,
            "residenteId": record.residente_id.id if record.residente_id else False,
            "partnerId": record.partner_id.id if record.partner_id else False,
            "amount": record.amount,
            "currency": record.currency_id.name,
            "periodLabel": record.period_label or "",
            "dueDate": record.due_date.isoformat() if record.due_date else None,
            "state": record.state,
            "moveId": record.move_id.id if record.move_id else False,
            "paymentId": record.payment_id.id if record.payment_id else False,
            "paymentMethod": record.payment_method or "",
            "paymentReference": record.payment_reference or "",
            "paidAt": fields.Datetime.to_string(record.paid_at) if record.paid_at else None,
            "note": record.note or "",
        }

    def _selected_condominios(self, user):
        domain = list(self.condominio_domain(user))
        condominio_id = request.httprequest.args.get("condominio_id")
        if condominio_id:
            domain.append(("id", "=", int(condominio_id)))
        return request.env["condome.condominio"].sudo().search(domain)

    def _validate_apartment(self, condominio, apartamento_id):
        if not apartamento_id:
            return request.env["condome.apartamento"]
        apartment = request.env["condome.apartamento"].sudo().search(
            [("id", "=", int(apartamento_id)), ("condominio_id", "=", condominio.id)],
            limit=1,
        )
        if not apartment:
            raise ValueError(_("El apartamento seleccionado no existe"))
        return apartment

    def _resolve_billing_parties(self, apartment, include_partner=False):
        """Asigna responsable principal del cargo a partir de la unidad seleccionada."""
        if not apartment:
            values = {
                "propietario_id": False,
                "residente_id": False,
            }
            if include_partner:
                values["partner_id"] = False
            return values

        owner = apartment.propietario_ids.filtered(lambda item: item.estado == "active")[:1]
        resident = apartment.residente_ids.filtered("activo")[:1]
        partner = owner.partner_id or resident.partner_id
        values = {
            "propietario_id": owner.id if owner else False,
            "residente_id": resident.id if resident else False,
        }
        if include_partner:
            values["partner_id"] = partner.id if partner else False
        return values

    def _property_owner_records(self, user):
        owners = request.env["condome.propietario"].sudo().search([("user_id", "=", user.id)])
        if not owners:
            raise PermissionError(_("Este usuario no tiene un perfil de propietario asociado"))
        return owners

    def _resident_records(self, user):
        residents = request.env["condome.residente"].sudo().search([("user_id", "=", user.id)])
        if not residents:
            raise PermissionError(_("Este usuario no tiene un perfil de residente asociado"))
        return residents

    def _self_service_payment_values(self, payload, current_state):
        if current_state == "cancelled":
            raise ValueError(_("Un cargo cancelado no puede pagarse"))
        payment_method = payload.get("paymentMethod") or payload.get("payment_method") or "portal"
        payment_reference = self.clean_str(payload.get("paymentReference") or payload.get("payment_reference"))
        return {
            "payment_method": payment_method,
            "payment_reference": payment_reference,
        }

    def _serialize_charge_list(self, records):
        return [self.serialize_charge(record) for record in records]

    def _property_owner_charge_domain(self, owners):
        apartment_ids = owners.mapped("apartamento_id").ids
        return [
            "|",
            ("propietario_id", "in", owners.ids),
            ("apartamento_id", "in", apartment_ids),
        ]

    def _resident_charge_domain(self, residents):
        apartment_ids = residents.mapped("apartamento_id").ids
        return [
            "|",
            ("residente_id", "in", residents.ids),
            ("apartamento_id", "in", apartment_ids),
        ]

    def handle_fee_templates(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            model = request.env["condome.fee.template"].sudo()

            if request.httprequest.method == "GET":
                condominios = self._selected_condominios(user)
                records = model.search([("condominio_id", "in", condominios.ids)])
                return self.build_response({"data": [self.serialize_fee_template(record) for record in records]})

            payload = self.read_payload()
            condominio = self.get_condominio(int(payload.get("condominio_id")), user)
            apartment = self._validate_apartment(condominio, payload.get("apartamento_id"))
            name = self.clean_str(payload.get("name"))
            amount = float(payload.get("amount") or 0)
            if not name or amount <= 0:
                return self.error_response(_("Nombre y monto son requeridos"))

            record_values = {
                "name": name,
                "condominio_id": condominio.id,
                "apartamento_id": apartment.id if apartment else False,
                "amount": amount,
                "due_day": int(payload.get("dueDay") or 5),
                "frequency": payload.get("frequency") or "monthly",
                "active": bool(payload.get("active", True)),
                "note": self.clean_str(payload.get("note")),
            }
            record_values.update(self._resolve_billing_parties(apartment))
            record = model.create(record_values)
            return self.build_response({"data": self.serialize_fee_template(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Fee templates failed")
            return self.error_response(error, status=400)

    def handle_fee_template_update(self, template_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            record = request.env["condome.fee.template"].sudo().search(
                [("id", "=", template_id), ("condominio_id", "in", self._selected_condominios(user).ids)],
                limit=1,
            )
            if not record:
                return self.error_response(_("Plantilla de cuota no encontrada"), status=404)

            payload = self.read_payload()
            values = {}
            if "name" in payload:
                values["name"] = self.clean_str(payload.get("name")) or record.name
            if "amount" in payload:
                values["amount"] = float(payload.get("amount") or record.amount)
            if "dueDay" in payload:
                values["due_day"] = int(payload.get("dueDay") or record.due_day)
            if "frequency" in payload:
                values["frequency"] = payload.get("frequency") or record.frequency
            if "active" in payload:
                values["active"] = bool(payload.get("active"))
            if "note" in payload:
                values["note"] = self.clean_str(payload.get("note"))
            if "apartamento_id" in payload:
                apartment = self._validate_apartment(record.condominio_id, payload.get("apartamento_id"))
                values["apartamento_id"] = apartment.id if apartment else False
                values.update(self._resolve_billing_parties(apartment))
            record.write(values)
            return self.build_response({"data": self.serialize_fee_template(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Fee template update failed")
            return self.error_response(error, status=400)

    def handle_charges(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            model = request.env["condome.charge"].sudo()

            if request.httprequest.method == "GET":
                condominios = self._selected_condominios(user)
                domain = [("condominio_id", "in", condominios.ids)]
                state = request.httprequest.args.get("state")
                if state:
                    domain.append(("state", "=", state))
                records = model.search(domain)
                return self.build_response({"data": [self.serialize_charge(record) for record in records]})

            payload = self.read_payload()
            condominio = self.get_condominio(int(payload.get("condominio_id")), user)
            apartment = self._validate_apartment(condominio, payload.get("apartamento_id"))
            amount = float(payload.get("amount") or 0)
            due_date = payload.get("dueDate")
            name = self.clean_str(payload.get("name"))
            if not name or amount <= 0 or not due_date:
                return self.error_response(_("Nombre, monto y fecha de vencimiento son requeridos"))

            record_values = {
                "name": name,
                "condominio_id": condominio.id,
                "apartamento_id": apartment.id if apartment else False,
                "amount": amount,
                "period_label": self.clean_str(payload.get("periodLabel")),
                "due_date": due_date,
                "state": payload.get("state") or "pending",
                "note": self.clean_str(payload.get("note")),
            }
            record_values.update(self._resolve_billing_parties(apartment, include_partner=True))
            record = model.create(record_values)
            return self.build_response({"data": self.serialize_charge(record)}, status=201)
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Charges failed")
            return self.error_response(error, status=400)

    def handle_charge_update(self, charge_id):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            record = request.env["condome.charge"].sudo().search(
                [("id", "=", charge_id), ("condominio_id", "in", self._selected_condominios(user).ids)],
                limit=1,
            )
            if not record:
                return self.error_response(_("Cargo no encontrado"), status=404)

            payload = self.read_payload()
            values = {}
            if "name" in payload:
                values["name"] = self.clean_str(payload.get("name")) or record.name
            if "amount" in payload:
                values["amount"] = float(payload.get("amount") or record.amount)
            if "periodLabel" in payload:
                values["period_label"] = self.clean_str(payload.get("periodLabel"))
            if "dueDate" in payload:
                values["due_date"] = payload.get("dueDate")
            if "state" in payload:
                values["state"] = payload.get("state") or record.state
                if values["state"] == "paid" and record.state != "paid":
                    values["paid_at"] = fields.Datetime.now()
                elif values["state"] != "paid":
                    values["paid_at"] = False
            if "note" in payload:
                values["note"] = self.clean_str(payload.get("note"))
            if "paymentMethod" in payload or "payment_method" in payload:
                values["payment_method"] = payload.get("paymentMethod") or payload.get("payment_method")
            if "paymentReference" in payload or "payment_reference" in payload:
                values["payment_reference"] = self.clean_str(payload.get("paymentReference") or payload.get("payment_reference"))
            if "apartamento_id" in payload:
                apartment = self._validate_apartment(record.condominio_id, payload.get("apartamento_id"))
                values["apartamento_id"] = apartment.id if apartment else False
                values.update(self._resolve_billing_parties(apartment, include_partner=True))
            record.write(values)
            return self.build_response({"data": self.serialize_charge(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Charge update failed")
            return self.error_response(error, status=400)

    def handle_billing_summary(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            condominios = self._selected_condominios(user)
            templates = request.env["condome.fee.template"].sudo().search([("condominio_id", "in", condominios.ids)])
            charges = request.env["condome.charge"].sudo().search([("condominio_id", "in", condominios.ids)])
            pending = charges.filtered(lambda item: item.state == "pending")
            overdue = charges.filtered(lambda item: item.state == "overdue")
            paid = charges.filtered(lambda item: item.state == "paid")
            payload = {
                "templates": len(templates),
                "charges": len(charges),
                "pendingCharges": len(pending),
                "overdueCharges": len(overdue),
                "paidCharges": len(paid),
                "pendingAmount": sum(pending.mapped("amount")),
                "overdueAmount": sum(overdue.mapped("amount")),
                "paidAmount": sum(paid.mapped("amount")),
            }
            return self.build_response({"data": payload})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Billing summary failed")
            return self.error_response(error, status=400)

    def handle_property_owner_payments(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            owners = self._property_owner_records(user)
            model = request.env["condome.charge"].sudo()
            if request.httprequest.method == "GET":
                records = model.search(
                    self._property_owner_charge_domain(owners) + [("state", "in", ["pending", "overdue"])]
                )
                return self.build_response({"data": self._serialize_charge_list(records)})

            payload = self.read_payload()
            charge_id = int(payload.get("charge_id") or 0)
            record = model.search(self._property_owner_charge_domain(owners) + [("id", "=", charge_id)], limit=1)
            if not record:
                return self.error_response(_("Cargo no encontrado"), status=404)
            p_values = self._self_service_payment_values(payload, record.state)
            record.action_confirm_payment(method=p_values["payment_method"], reference=p_values["payment_reference"])
            return self.build_response({"data": self.serialize_charge(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Property owner payments failed")
            return self.error_response(error, status=400)

    def handle_property_owner_payment_history(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            owners = self._property_owner_records(user)
            records = request.env["condome.charge"].sudo().search(
                self._property_owner_charge_domain(owners) + [("state", "in", ["paid", "cancelled"])]
            )
            return self.build_response({"data": self._serialize_charge_list(records)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Property owner payment history failed")
            return self.error_response(error, status=400)

    def handle_resident_payments(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            residents = self._resident_records(user)
            model = request.env["condome.charge"].sudo()
            if request.httprequest.method == "GET":
                records = model.search(
                    self._resident_charge_domain(residents) + [("state", "in", ["pending", "overdue"])]
                )
                return self.build_response({"data": self._serialize_charge_list(records)})

            payload = self.read_payload()
            charge_id = int(payload.get("charge_id") or 0)
            record = model.search(self._resident_charge_domain(residents) + [("id", "=", charge_id)], limit=1)
            if not record:
                return self.error_response(_("Cargo no encontrado"), status=404)
            p_values = self._self_service_payment_values(payload, record.state)
            record.action_confirm_payment(method=p_values["payment_method"], reference=p_values["payment_reference"])
            return self.build_response({"data": self.serialize_charge(record)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Resident payments failed")
            return self.error_response(error, status=400)

    def handle_resident_payment_history(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_session()
            residents = self._resident_records(user)
            records = request.env["condome.charge"].sudo().search(
                self._resident_charge_domain(residents) + [("state", "in", ["paid", "cancelled"])]
            )
            return self.build_response({"data": self._serialize_charge_list(records)})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Resident payment history failed")
            return self.error_response(error, status=400)

    def handle_payments(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            records = request.env["condome.charge"].sudo().search(
                [("condominio_id", "in", self._selected_condominios(user).ids), ("state", "=", "paid")]
            )
            return self.build_response({"data": [self.serialize_charge(record) for record in records]})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Payments list failed")
            return self.error_response(error, status=400)

    def handle_payment_history(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            records = request.env["condome.charge"].sudo().search(
                [
                    ("condominio_id", "in", self._selected_condominios(user).ids),
                    ("state", "in", ["paid", "cancelled"]),
                ]
            )
            return self.build_response({"data": [self.serialize_charge(record) for record in records]})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Payment history failed")
            return self.error_response(error, status=400)

    def handle_delinquency(self):
        try:
            if self.is_preflight_request():
                return self.handle_options()

            user = self.require_owner_session()
            today = fields.Date.today()
            records = request.env["condome.charge"].sudo().search(
                [
                    ("condominio_id", "in", self._selected_condominios(user).ids),
                    ("state", "in", ["pending", "overdue"]),
                ]
            )
            for record in records.filtered(lambda item: item.due_date and item.due_date < today and item.state == "pending"):
                record.write({"state": "overdue"})
            overdue_records = records.filtered(lambda item: item.state == "overdue")
            payload = {
                "total": len(overdue_records),
                "amount": sum(overdue_records.mapped("amount")),
                "items": [self.serialize_charge(record) for record in overdue_records],
            }
            return self.build_response({"data": payload})
        except PermissionError as error:
            return self.error_response(error, status=403)
        except Exception as error:  # pragma: no cover
            _logger.exception("Delinquency summary failed")
            return self.error_response(error, status=400)
