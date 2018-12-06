<?php

function ConnectMySQL(){
    $string = file_get_contents("config.json");
	$config = json_decode($string, true);
	$sqlConfig = $config["mysqlAuth"];
	$conn = new mysqli($sqlConfig["host"], $sqlConfig["username"], $sqlConfig["password"], $sqlConfig["dbName"]);
	if ($conn->connect_error) {
	    return NULL;
	}
	else{
		$conn->query("SET NAMES UTF8");
		return $conn;
	}
}

?>