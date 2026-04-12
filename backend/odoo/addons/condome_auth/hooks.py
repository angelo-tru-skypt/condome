from odoo import api, SUPERUSER_ID


def post_init_condome_auth(env):
    group = env.ref("condome_auth.group_condome_owner", raise_if_not_found=False)
    if not group:
        return
    admin_users = env["res.users"].sudo().search([("login", "in", ("admin", "odoo"))])
    for user in admin_users:
        if group.id not in user.groups_id.ids:
            user.sudo().write({"groups_id": [(4, group.id)]})
