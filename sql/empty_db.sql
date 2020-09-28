--  phpMyAdmin SQL Dump
--  version 4.0.10.6
--  http://www.phpmyadmin.net
-- 
--  Host: mysql-risc.alwaysdata.net
--  Generation Time: Oct 09, 2017 at 04:56 PM
--  Server version: 10.1.23-MariaDB
--  PHP Version: 5.6.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


--  *!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
--  *!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
--  *!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
--  *!40101 SET NAMES utf8 */;

-- 
--  Database: `risc_human_rl`
-- 

--  -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 

-- 
--  Table structure for table `experiment_data`
-- -- 
-- 
-- CREATE TABLE IF NOT EXISTS `experiment_data` (
-- `EXPID` varchar(20) NOT NULL,
-- `ID` varchar(100) NOT NULL,
-- `EXP` varchar(20) NOT NULL,
-- `BROW` text NOT NULL,
-- `DBTIME` datetime NOT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
--  Table structure for table `experiment_data`
-- --

 CREATE TABLE IF NOT EXISTS `experiment_data_r_and_c` (
 `EXPID` varchar(20) NOT NULL,
 `ID` varchar(100) NOT NULL,
 `EXP` varchar(20) NOT NULL,
 `BROW` text NOT NULL,
 `DBTIME` datetime NOT NULL
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--  -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 

-- 
--  Table structure for table `learning_data`
-- 

CREATE TABLE IF NOT EXISTS `learning_data_r_and_c` (
`EXP` varchar(20) NOT NULL,
`EXPID` varchar(20) NOT NULL,
`ID` varchar(100) NOT NULL,
`ELIC` int(11) NOT NULL,
`P1` double NOT NULL,
`P2` double NOT NULL,
`RTIME` bigint(20) NOT NULL,
`OUT` int(11) NOT NULL,
`CF_OUT` int(11) NOT NULL,
`CHOICE` int(11) NOT NULL,
`CORRECT_CHOICE` int(11) NOT NULL,
`TEST` int(11) NOT NULL,
`TRIAL` int(11) NOT NULL,
`COND` int(11) NOT NULL,
`CONT1` int(11) NOT NULL,
`CONT2` int(11) NOT NULL,
`SYML` varchar(20) NOT NULL,
`SYMR` varchar(20) NOT NULL,
`LR` int(11) NOT NULL,
`REW` double NOT NULL,
`SESSION` int(11) NOT NULL,
`OP1` int(11) NOT NULL,
`OP2` int(11) NOT NULL,
`EV1` double NOT NULL,
`EV2`  double NOT NULL,
`CATCH` tinyint(4) NOT NULL,
`INV` tinyint(4) NOT NULL,
`CTIME` bigint(20) NOT NULL,
`DIST` int(11) NOT NULL,
`PLOT` double NOT NULL,
`DBTIME` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--  -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 

-- 
--  Table structure for table `questionnaire_data`
-- 

 CREATE TABLE IF NOT EXISTS `questionnaire_data_r_and_c` (
 `EXP` varchar(20) NOT NULL,
 `EXPID` varchar(20) NOT NULL,
 `ID` varchar(100) NOT NULL,
 `QUESTIONNAIRE` varchar(20) NOT NULL,
 `NUMBER` int(11) NOT NULL,
 `ITEM` int(11) NOT NULL,
 `ANSWER` int(11) NOT NULL,
 `VAL` int(11) NOT NULL,
 `RTIME` bigint(20) NOT NULL,
 `DBTIME` time NOT NULL
 ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
-- 
-- --  -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
-- 
-- -- 
-- --  Table structure for table `users`
-- -- 
-- 
-- CREATE TABLE IF NOT EXISTS `users` (
-- `ID` varchar(100) NOT NULL,
-- `AGE` int(2) NOT NULL,
-- `GENDER` varchar(20) NOT NULL,
-- `COUNTRY` varchar(20) NOT NULL,
-- `EDUCATION` varchar(20) NOT NULL,
-- `TIME` varchar(20) NOT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
-- 
-- /*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
-- /*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
-- /*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
