2025_02_03 extract
sql = select concat(tensu_kbn, kn_no, kbn_eda) as kubun, code, name, col_0068, tensu from mastere_procedure 
where name ~ '加算' and in_out_flg != '1' and hosp_cliniv_ != '1'
order by kubun, code;

\copy (sql) to '/usr/src/kasan.csv'