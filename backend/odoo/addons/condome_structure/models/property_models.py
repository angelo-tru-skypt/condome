from odoo import api, fields, models
from odoo.exceptions import ValidationError


class CondomeCondominio(models.Model):
    """Modelo raíz para soportar la operación multi-condominio."""

    _name = "condome.condominio"
    _description = "Condominio"
    _order = "id desc"

    name = fields.Char(required=True)
    tipo = fields.Selection(
        [
            ("residencial", "Residencial"),
            ("comercial", "Comercial"),
            ("mixto", "Mixto"),
        ],
        default="residencial",
        required=True,
    )
    rnc = fields.Char()
    direccion = fields.Char(required=True)
    ciudad = fields.Char()
    pais = fields.Char()
    telefono = fields.Char()
    email = fields.Char()
    owner_user_id = fields.Many2one("res.users", required=True, default=lambda self: self.env.user)
    company_id = fields.Many2one("res.company", required=True, default=lambda self: self.env.company)
    edificio_ids = fields.One2many("condome.edificio", "condominio_id")
    apartamento_ids = fields.One2many("condome.apartamento", "condominio_id")


class CondomeEdificio(models.Model):
    """Agrupa apartamentos dentro de un mismo condominio."""

    _name = "condome.edificio"
    _description = "Edificio"
    _order = "name asc, id asc"

    name = fields.Char(required=True)
    codigo = fields.Char()
    niveles = fields.Integer(default=1)
    descripcion = fields.Text()
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)
    apartamento_ids = fields.One2many("condome.apartamento", "edificio_id")


class CondomeApartamento(models.Model):
    """Unidad inmobiliaria asociada a un edificio."""

    _name = "condome.apartamento"
    _description = "Apartamento"
    _order = "edificio_id asc, name asc"

    name = fields.Char(required=True)
    piso = fields.Char()
    tipo_unidad = fields.Selection(
        [
            ("apartamento", "Apartamento"),
            ("penthouse", "Penthouse"),
            ("estudio", "Estudio"),
            ("local", "Local"),
        ],
        default="apartamento",
        required=True,
    )
    metraje = fields.Float()
    estado = fields.Selection(
        [
            ("disponible", "Disponible"),
            ("ocupado", "Ocupado"),
            ("mantenimiento", "Mantenimiento"),
            ("inactivo", "Inactivo"),
        ],
        default="disponible",
        required=True,
    )
    condominio_id = fields.Many2one("condome.condominio", required=True, ondelete="cascade")
    edificio_id = fields.Many2one("condome.edificio", required=True, ondelete="cascade")
    company_id = fields.Many2one(related="condominio_id.company_id", store=True)

    @api.constrains("edificio_id", "condominio_id")
    def _check_same_condominio(self):
        for record in self:
            if record.edificio_id and record.edificio_id.condominio_id != record.condominio_id:
                raise ValidationError("El edificio no pertenece al condominio seleccionado.")

    def sync_estado_ocupacion(self):
        """Sincroniza ocupación cuando el módulo de residentes está instalado."""
        if not self.env.registry.get("condome.residente"):
            return
        empty_residents = self.env["condome.residente"].browse()
        for apartment in self:
            resident_ids = getattr(apartment, "residente_ids", empty_residents)
            active_residents = resident_ids.filtered("activo") if hasattr(resident_ids, "filtered") else empty_residents
            if active_residents:
                apartment.estado = "ocupado"
            elif apartment.estado == "ocupado":
                apartment.estado = "disponible"
