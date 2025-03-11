import os
from starlette.applications import Starlette
from starlette.routing import Route, Mount
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.authentication import AuthenticationMiddleware
from .router import (
    account,
    karte,
    diagnosis,
    document,
    facility,
    lab_test,
    patient,
    pvt,
    risk,
    stamp,
    user,
    receipt,
    master,
    plugin,
)
from .lib.jwt_auth import JWTAuthBackend
from .db import database
from .util.tracer import get_logger


async def startup():
    # Orion
    app.state.orion_pool = await database.create_master_pool(os.getenv("DSN_MASTER"))
    get_logger(__name__).info("Master pool created.")
    # Magellan
    app.state.magellan_pool = await database.create_karte_pool(os.getenv("DSN_KARTE"))
    get_logger(__name__).info("Karte pool created.")


async def shutdown():
    await app.state.orion_pool().close()
    await app.state.magellan_pool().close()


routes = [
    Mount(
        "/master/api/v1",
        routes=[
            Route("/desease", master.find_desease_by_name),
            Route("/desease/modifier", master.find_desease_modifier),
            Route("/desease/icd10", master.find_desease_by_icd10),
            Route("/medical_procedures/kbn/kbnno", master.find_procedures_by_kbn_kbnno),
            Route("/medical_procedures/name", master.find_procedures_by_name),
            Route("/medicine/name", master.find_medicine_by_name),
            Route("/medicine/contrast_medium", master.list_contrast_medium),
            Route("/tool/name", master.find_tool_by_name),
            Route("/comment/name", master.find_comment_by_name),
            Route("/comment/code", master.find_comment_by_code),
            Route("/yoho/naihuku/code/name", master.find_yoho_naihuku_code_name),
            Route("/yoho/naihuku/code/timing", master.find_yoho_naihuku_code_timing),
            Route("/yoho/gaiyo/code/detail", master.find_yoho_gaiyo_code_detail),
            Route("/name", master.find_master_by_name),
            Route("/code", master.find_master_by_code),
            Route("/address/zip_code/{code}", master.find_address_by_zip_code),
            Route("/departments", master.list_all_depts),
            Route("/short_name", master.list_short_name),
            Route("/notification", master.find_notification),
            Route("/prefecture_code", master.get_prefecture_code),
        ],
    ),
    Mount(
        "/account/api/v1",
        routes=[
            Route("/sign_up", account.sign_up, methods=["POST"]),
            Route("/sign_in", account.login, methods=["POST"]),
            Route("/user/{id}", account.update_user_info, methods=["PUT"]),
            Route("/facility/users", account.list_users_in_facility, methods=["GET"]),
            Route("/facility/user_status", account.update_user_status, methods=["PUT"]),
        ],
    ),
    Mount(
        "/karte/api/v1",
        routes=[
            Route("/user/settings", user.upcert_user_settings, methods=["PUT"]),
            Route(
                "/facility/time_schedule", facility.get_time_schedule, methods=["GET"]
            ),
            Route(
                "/facility/time_schedule",
                facility.replace_time_schedule,
                methods=["POST"],
            ),
            Route("/facility/notification", facility.get_notification, methods=["GET"]),
            Route("/facility/notification", facility.update_notification, methods=["PUT"]),
            Route("/facility/{id}", facility.update_facility_info, methods=["PUT"]),
            # Patient
            Route("/patients", patient.get, methods=["GET"]),
            Route("/patients", patient.post, methods=["POST"]),
            Route("/patients", patient.put, methods=["PUT"]),
            Route("/patients/{patient_id}", patient.delete, methods=["DELETE"]),
            # Patient Visit
            Route("/pvt", pvt.get, methods=["GET"]),
            Route("/pvt", pvt.post, methods=["POST"]),
            Route("/pvt", pvt.put, methods=["PUT"]),
            Route("/pvt/face", pvt.post_face, methods=["POST"]),
            Route("/pvt/face", pvt.put_face, methods=["PUT"]),
            Route("/pvt/lock", pvt.get_lock, methods=["GET"]),
            Route("/pvt/{fc_id}/{pvt_id}", pvt.delete, methods=["DELETE"]),
            # Stamp
            Route("/stamp", stamp.save_stamp, methods=["POST"]),
            Route("/stamp/entity", stamp.get_stamp_by_entity, methods=["GET"]),
            Route("/stamp/order", stamp.update_stamp_order, methods=["PUT"]),  # name
            Route("/stamp/name/{id}", stamp.update_stamp_name, methods=["PUT"]),  # name
            # Disease Stamp
            Route("/stamp/disease", stamp.get_disease_stamps, methods=["GET"]),
            Route("/stamp/disease", stamp.save_disease_stamp, methods=["POST"]),
            Route("/stamp/disease/order", stamp.update_disease_order, methods=["PUT"]),
            Route("/stamp/disease/{id}", stamp.update_disease_stamp, methods=["PUT"]),
            Route(
                "/stamp/disease/{id}", stamp.delete_disease_stamp, methods=["DELETE"]
            ),
            # Procedure Stamp
            Route(
                "/stamp/procedure_catalogue",
                stamp.get_procedure_catalogue,
                methods=["GET"],
            ),
            Route(
                "/stamp/using_procedure", stamp.get_using_procedures, methods=["GET"]
            ),
            Route(
                "/stamp/using_procedure/{facility_id}",
                stamp.update_using_procedure,
                methods=["PUT"],
            ),
            # Input Stamp
            Route("/stamp/input_catalogue", stamp.get_input_catalogue, methods=["GET"]),
            Route("/stamp/input_bundle", stamp.get_input_bundle, methods=["GET"]),
            Route("/stamp/using_input", stamp.get_using_inputs, methods=["GET"]),
            Route(
                "/stamp/using_input/{facility_id}",
                stamp.update_using_input,
                methods=["PUT"],
            ),
            # Delete Stamp
            Route("/stamp/{id}", stamp.delete_stamp, methods=["DELETE"]),
            # Diagnosis
            Route("/diagnosis", diagnosis.save_diagnosis, methods=["POST"]),
            Route("/diagnosis/list", diagnosis.get_diagnosis_list, methods=["GET"]),
            Route("/diagnosis/active", diagnosis.get_active_diagnosis, methods=["GET"]),
            Route("/diagnosis/{id}", diagnosis.update_diagnosis, methods=["PUT"]),
            Route("/diagnosis/{id}", diagnosis.delete_diagnosis, methods=["delete"]),
            # Karte
            Route("/karte", karte.get, methods=["GET"]),
            Route("/karte", karte.post, methods=["POST"]),
            Route("/karte/{id}", karte.delete, methods=["DELETE"]),
            # Memo
            Route("/risk/summary_memo", risk.get_summary_memo, methods=["GET"]),
            Route("/risk/summary_memo", risk.upcert_summary_memo, methods=["POST"]),
            # Risk
            Route("/risk/{entity}", risk.get_risk, methods=["GET"]),
            Route("/risk/{entity}", risk.upcert_risk, methods=["POST"]),
            Route("/risk/{entity}/{id}", risk.delete_risk, methods=["DELETE"]),
            # Lab. Test
            Route("/lab_test", lab_test.save_lab_test, methods=["POST"]),
            Route("/lab_test/pivot", lab_test.get_lab_test_pivot, methods=["GET"]),
            Route(
                "/lab_test/abnormal", lab_test.get_abnormal_lab_test, methods=["GET"]
            ),
            Route("/lab_test/{id}", lab_test.delete_lab_test, methods=["DELETE"]),
            # Document
            Route("/document", document.save_document, methods=["POST"]),
            Route(
                "/document/facility",
                document.get_document_list_by_facility,
                methods=["GET"],
            ),
            Route(
                "/document/patient",
                document.get_document_list_by_patient,
                methods=["GET"],
            ),
            Route("/document/{id}", document.get_document, methods=["GET"]),
            Route("/document/{id}", document.update_document, methods=["PUT"]),
            Route("/document/{id}", document.delete_document, methods=["DELETE"]),
            # Receipt
            Route("/receipt/monthly", receipt.get_monthly, methods=["GET"]),
            Route("/receipt/monthly", receipt.relay_monthly_receipt, methods=["POST"]),
        ],
    ),
    Mount(
        "/plugin/api/v1",
        routes=[
            Route("/list", plugin.list_plugins, methods=["GET"]),
            Route("/plug_point", plugin.get_plugin, methods=["GET"]),
        ],
    ),
    # Mount('/oql/api/v1', routes = [
    #     Route('/face', account.stream_accept_account, methods=['POST']),
    # ]),
    Mount(
        "/stream/api/v1",
        routes=[
            # Streaming
            Route("/accept/account", account.stream_accept_account, methods=["POST"]),
            Route("/accept/call", account.stream_accept_call, methods=["POST"]),
            Route("/accept/user", account.stream_accept_add_user, methods=["POST"]),
            Route("/facility/user", account.stream_add_user, methods=["POST"]),
            Route("/change_username", account.stream_change_username, methods=["POST"]),
            Route("/test/{id}", lab_test.stream_get_test, methods=["GET"]),
            Route("/patient/{id}", patient.stream_get_patient, methods=["GET"]),
        ],
    ),
]

middleware = [
    Middleware(AuthenticationMiddleware, backend=JWTAuthBackend()),
    Middleware(CORSMiddleware, allow_origins=["*"]),
]

app = Starlette(
    debug=False,
    routes=routes,
    middleware=middleware,
    on_startup=[startup],
    on_shutdown=[shutdown],
)
